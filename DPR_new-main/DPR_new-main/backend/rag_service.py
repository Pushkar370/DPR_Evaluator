import logging
import uuid
from typing import List, Dict, Any

try:
    from qdrant_client import QdrantClient
    from qdrant_client.http.models import PointStruct, VectorParams, Distance, Filter, FieldCondition, MatchValue
except ImportError:
    pass

from backend.config import settings

logger = logging.getLogger(__name__)

class FlexibleDocumentRAG:
    """
    Chunks flexible markdown output and indexes it into Qdrant for the AI to query dynamically.
    Creates a temporary separate collection per job_id or uses a payload filter.
    """
    def __init__(self):
        try:
            # Use completely in-memory Qdrant instance for zero-dependency testing
            self.qdrant = QdrantClient(path=settings.QDRANT_LOCAL_PATH)
            self.collection_name = "dpr_documents"
            
            # Load HuggingFace embeddings locally
            from sentence_transformers import SentenceTransformer
            self.encoder = SentenceTransformer(settings.LOCAL_EMBEDDING_MODEL)
            # all-MiniLM-L6-v2 vector size is 384
            self.vector_size = self.encoder.get_sentence_embedding_dimension()
            
            # Ensure document collection exists
            collections = self.qdrant.get_collections().collections
            if not any(c.name == self.collection_name for c in collections):
                self.qdrant.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=self.vector_size, distance=Distance.COSINE),
                )
            
            self.enabled = True
        except Exception as e:
            logger.warning(f"Failed to initialize flexible RAG system (requires sentence-transformers & qdrant-client): {e}")
            self.enabled = False

    def chunk_markdown(self, markdown_text: str, max_chunk_size: int = 1500) -> List[Dict[str, Any]]:
        """
        Splits markdown into logical chunks based on headers (## Page, ### Header)
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
                
                # If current page chunk is getting big, flush it
                if len(current_chunk) > max_chunk_size:
                    chunks.append({"text": current_chunk.strip(), "page": current_page})
                    current_chunk = ""
                else:
                    current_chunk += f"\n{line}\n"
            elif line.startswith('### '):
                # Major section break
                if len(current_chunk) > 500:
                    chunks.append({"text": current_chunk.strip(), "page": current_page})
                    current_chunk = f"{line}\n"
                else:
                    current_chunk += f"\n{line}\n"
            else:
                current_chunk += f"{line}\n"
                
                # Hard limit just in case a section is huge
                if len(current_chunk) > max_chunk_size * 2:
                    chunks.append({"text": current_chunk.strip(), "page": current_page})
                    current_chunk = ""
                    
        if current_chunk.strip():
            chunks.append({"text": current_chunk.strip(), "page": current_page})
            
        return chunks

    def ingest_document(self, job_id: str, markdown_text: str):
        """
        Chunks and vectorizes the uploaded document for selective querying.
        """
        if not self.enabled:
            logger.warning("RAG indexing disabled due to missing Qdrant/SentenceTransformers setup. Skipping ingestion.")
            return

        chunks = self.chunk_markdown(markdown_text)
        logger.info(f"[RAG INGESTION] Chunked document {job_id} into {len(chunks)} chunks.")
        
        batch_texts = []
        batch_metadata = []
        
        # Batch create embeddings
        for chunk in chunks:
            batch_texts.append(chunk["text"])
            batch_metadata.append({
                "job_id": job_id,
                "page": chunk["page"],
                "text": chunk["text"]
            })
            
            # Simple batching mechanism (process 20 at a time)
            if len(batch_texts) >= 20:
                self._upsert_batch(batch_texts, batch_metadata)
                batch_texts, batch_metadata = [], []
                
        if batch_texts:
            self._upsert_batch(batch_texts, batch_metadata)
            
        logger.info(f"[RAG INGESTION] Successfully ingested document {job_id}")

    def _upsert_batch(self, texts: List[str], metadata: List[Dict[str, Any]]):
        try:
            # Create embeddings using local SentenceTransformer
            embeddings = self.encoder.encode(texts).tolist()
            
            points = []
            for emb, meta in zip(embeddings, metadata):
                points.append(
                    PointStruct(
                        id=str(uuid.uuid4()),
                        vector=emb,
                        payload=meta
                    )
                )
                
            self.qdrant.upsert(
                collection_name=self.collection_name,
                points=points
            )
        except Exception as e:
            logger.error(f"Error upserting batch: {e}")

    def query_document(self, job_id: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieves specific portions of the document relevant to the query.
        """
        if not self.enabled:
            return []
            
        try:
            # Encode query using local SentenceTransformer
            vector = self.encoder.encode(query).tolist()
            
            search_result = self.qdrant.query_points(
                collection_name=self.collection_name,
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
            logger.error(f"[RAG QUERY] Failed to query document {job_id}: {e}")
            return []

document_rag = FlexibleDocumentRAG()
