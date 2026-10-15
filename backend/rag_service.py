import logging
import uuid
from typing import List, Dict, Any, Optional

try:
    from qdrant_client import QdrantClient
    from qdrant_client.http.models import PointStruct, VectorParams, Distance, Filter, FieldCondition, MatchValue
except ImportError:
    pass

from backend.config import settings

logger = logging.getLogger(__name__)

class FlexibleDocumentRAG:
    """
    RAG service managing both DPR document chunks and NE-SIDS guideline collections
    using local sentence-transformers (all-MiniLM-L6-v2, 384-dim).
    """
    def __init__(self):
        try:
            self.qdrant = QdrantClient(path=settings.QDRANT_LOCAL_PATH)
            self.doc_collection = settings.QDRANT_COLLECTION_NAME       # dpr_documents
            self.guide_collection = settings.GUIDELINES_COLLECTION_NAME # dpr_guidelines
            
            from sentence_transformers import SentenceTransformer
            self.encoder = SentenceTransformer(settings.LOCAL_EMBEDDING_MODEL)
            self.vector_size = self.encoder.get_embedding_dimension()
            
            existing = [c.name for c in self.qdrant.get_collections().collections]
            
            if self.doc_collection not in existing:
                self.qdrant.create_collection(
                    collection_name=self.doc_collection,
                    vectors_config=VectorParams(size=self.vector_size, distance=Distance.COSINE),
                )
                logger.info(f"[RAG] Created collection {self.doc_collection}")

            if self.guide_collection not in existing:
                self.qdrant.create_collection(
                    collection_name=self.guide_collection,
                    vectors_config=VectorParams(size=self.vector_size, distance=Distance.COSINE),
                )
                logger.info(f"[RAG] Created collection {self.guide_collection}")
            
            self.enabled = True
        except Exception as e:
            logger.warning(f"[RAG] Initialization warning: {e}. Semantic vector search may be limited.")
            self.enabled = False

    def chunk_markdown(self, markdown_text: str, max_chunk_size: int = 1200) -> List[Dict[str, Any]]:
        """
        Splits markdown into logical chunks tagged with page numbers and major headers.
        """
        chunks = []
        current_chunk = ""
        current_page = 1
        
        lines = markdown_text.split('\n')
        for line in lines:
            if line.startswith('## Page '):
                try:
                    current_page = int(line.replace('## Page ', '').strip())
                except ValueError:
                    pass
                
                if len(current_chunk) > max_chunk_size:
                    chunks.append({"text": current_chunk.strip(), "page": current_page})
                    current_chunk = ""
                else:
                    current_chunk += f"\n{line}\n"
            elif line.startswith('### '):
                if len(current_chunk) > 400:
                    chunks.append({"text": current_chunk.strip(), "page": current_page})
                    current_chunk = f"{line}\n"
                else:
                    current_chunk += f"\n{line}\n"
            else:
                current_chunk += f"{line}\n"
                if len(current_chunk) > max_chunk_size * 2:
                    chunks.append({"text": current_chunk.strip(), "page": current_page})
                    current_chunk = ""
                    
        if current_chunk.strip():
            chunks.append({"text": current_chunk.strip(), "page": current_page})
            
        return chunks

    def ingest_document(self, job_id: str, markdown_text: str):
        """Vectorizes and indexes the DPR document."""
        if not self.enabled:
            return

        chunks = self.chunk_markdown(markdown_text)
        logger.info(f"[RAG INGESTION] Chunked DPR {job_id} into {len(chunks)} chunks.")
        
        batch_texts, batch_metadata = [], []
        for chunk in chunks:
            batch_texts.append(chunk["text"])
            batch_metadata.append({
                "job_id": job_id,
                "page": chunk["page"],
                "text": chunk["text"]
            })
            if len(batch_texts) >= 32:
                self._upsert_batch(self.doc_collection, batch_texts, batch_metadata)
                batch_texts, batch_metadata = [], []
                
        if batch_texts:
            self._upsert_batch(self.doc_collection, batch_texts, batch_metadata)

    def ingest_guidelines_batch(self, chunks: List[Dict[str, Any]]):
        """Indexes guideline chunks into the guidelines collection."""
        if not self.enabled or not chunks:
            return

        batch_texts, batch_metadata = [], []
        for c in chunks:
            batch_texts.append(c["text"])
            batch_metadata.append({
                "pillar": c.get("pillar", "general").lower(),
                "page": c.get("page", 1),
                "source_doc": c.get("source_doc", "guideline.pdf"),
                "text": c["text"]
            })
            if len(batch_texts) >= 32:
                self._upsert_batch(self.guide_collection, batch_texts, batch_metadata)
                batch_texts, batch_metadata = [], []

        if batch_texts:
            self._upsert_batch(self.guide_collection, batch_texts, batch_metadata)

    def _upsert_batch(self, collection_name: str, texts: List[str], metadata: List[Dict[str, Any]]):
        try:
            embeddings = self.encoder.encode(texts).tolist()
            points = [
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=emb,
                    payload=meta
                ) for emb, meta in zip(embeddings, metadata)
            ]
            self.qdrant.upsert(collection_name=collection_name, points=points)
        except Exception as e:
            logger.error(f"[RAG UPSERT] Failed to upsert batch to {collection_name}: {e}")

    def query_document(self, job_id: str, query: str, limit: int = 15) -> List[Dict[str, Any]]:
        """
        Retrieves context chunks for the DPR. Default limit=15 provides comprehensive
        context for pillar agents evaluating 200+ page documents.
        """
        if not self.enabled:
            return []
            
        try:
            vector = self.encoder.encode(query).tolist()
            search_result = self.qdrant.query_points(
                collection_name=self.doc_collection,
                query=vector,
                limit=limit,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="job_id",
                            match=MatchValue(value=job_id)
                        )
                    ]
                )
            )
            return [hit.payload for hit in search_result.points]
        except Exception as e:
            logger.error(f"[RAG QUERY] Failed querying DPR {job_id}: {e}")
            return []

    def query_guidelines(self, pillar: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieves relevant NE-SIDS guideline chunks filtered by pillar.
        """
        if not self.enabled:
            return []

        try:
            vector = self.encoder.encode(query).tolist()
            search_result = self.qdrant.query_points(
                collection_name=self.guide_collection,
                query=vector,
                limit=limit,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="pillar",
                            match=MatchValue(value=pillar.lower())
                        )
                    ]
                )
            )
            return [hit.payload for hit in search_result.points]
        except Exception as e:
            logger.debug(f"[RAG GUIDELINES] Query error (collection may be empty): {e}")
            return []

    def has_guidelines(self, pillar: Optional[str] = None) -> bool:
        """Checks if guideline collection has any chunks indexed."""
        if not self.enabled:
            return False
        try:
            info = self.qdrant.get_collection(self.guide_collection)
            if info.points_count == 0:
                return False
            if not pillar:
                return True
            # Query with limit 1 to see if pillar exists
            res = self.query_guidelines(pillar, query=pillar, limit=1)
            return len(res) > 0
        except Exception:
            return False

document_rag = FlexibleDocumentRAG()
