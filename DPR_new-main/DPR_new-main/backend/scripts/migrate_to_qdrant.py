import os
import json
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
import google.generativeai as genai
from backend.config import settings

def main():
    qdrant = QdrantClient(path=settings.QDRANT_LOCAL_PATH)
    
    genai.configure(api_key=settings.GEMINI_API_KEY)

    collection_name = settings.QDRANT_COLLECTION_NAME

    # Create Collection
    try:
        qdrant.recreate_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=3072, distance=Distance.COSINE),
        )
        print(f"Collection {collection_name} created.")
    except Exception as e:
        print(f"Error creating collection: {e}")

    # Example Knowledge (Replace with actual text from rag_dpr/data/guidelines/)
    guidelines = [
        "Technical Rule 1: Infrastructure must use M25 grade concrete and adhere to safety standard IS 456.",
        "Environmental Rule 1: Rivers and forests must have state clearance before excavation starts.",
        "Admin Rule 1: A stakeholder consultation must occur 30 days prior, strictly approved by the district magistrate."
    ]

    points = []
    for i, guide in enumerate(guidelines):
        if not settings.GEMINI_API_KEY:
            print("No GEMINI_API_KEY provided. Skipping embedding.")
            break

        res = genai.embed_content(
            model=settings.GEMINI_EMBEDDING_MODEL,
            content=guide,
            task_type="retrieval_document"
        )
        vec = res['embedding']
        points.append(
            PointStruct(
                id=i+1,
                vector=vec,
                payload={"text": guide}
            )
        )

    if points:
        qdrant.upsert(
            collection_name=collection_name,
            points=points
        )
        print(f"Inserted {len(points)} guideline chunks into Qdrant.")

if __name__ == "__main__":
    main()
