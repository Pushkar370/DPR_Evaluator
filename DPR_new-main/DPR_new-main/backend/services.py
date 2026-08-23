import os
import json
import time
import logging
from typing import Dict, Any, Optional

import redis
from pydantic import ValidationError

# Cloud dependencies
from qdrant_client import QdrantClient

# Local configs and schemas
from backend.config import settings
from backend.schemas import AnalysisReport
from backend.worker import celery_app
from backend.extraction import extract_document_flexible
from backend.rag_service import document_rag
from backend.overview_analysis import generate_dynamic_overview

# Setup Cloud Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Local Memory Store to bypass Redis for testing
JOB_STORE = {}

def process_dpr_task(job_id: str, pdf_path: str):
    """
    Background Task executed directly.
    """
    start_time = time.time()
    logger.info(f"[JOB STARTED] Processing job {job_id} at {pdf_path}")
    
    # Initialize Job State
    report = AnalysisReport(job_id=job_id, status="PROCESSING")
    JOB_STORE[job_id] = report.model_dump_json()

    try:
        # Step 1: Flexible Document Extraction
        logger.info(f"[JOB EXTRACTING] Starting flexible extraction for {job_id}")
        extraction_result = extract_document_flexible(pdf_path, job_id)
        extracted_text = extraction_result["text_markdown"]
        
        # Step 1.5: RAG Ingestion (Index document for dynamic querying)
        logger.info(f"[JOB INGESTING] Vectorizing document chunks for {job_id}")
        document_rag.ingest_document(job_id, extracted_text)
        
        # Step 2: RAG Analysis
        logger.info(f"[JOB ANALYZING] Starting dynamic analysis for {job_id}")
        report = generate_dynamic_overview(job_id, extracted_text, extraction_result.get("images", []))
        report.processing_time = round(time.time() - start_time, 2)
        
        # Save Success State
        JOB_STORE[job_id] = report.model_dump_json()
        logger.info(f"[JOB COMPLETED] {job_id} took {report.processing_time}s")
        
    except Exception as e:
        logger.error(f"[JOB FAILED] {job_id}: {str(e)}")
        # Proper Error Bubble-up
        report.status = "FAILED"
        report.error_message = str(e)
        report.processing_time = round(time.time() - start_time, 2)
        JOB_STORE[job_id] = report.model_dump_json()

def process_dpr_file(job_id: str, pdf_path: str):
    """
    Trigger function called by FastAPI endpoint.
    Delegates natively in background tasks (bypassing celery).
    """
    process_dpr_task(job_id, pdf_path)

def get_job_status(job_id: str) -> Optional[AnalysisReport]:
    """
    Fetches job status from Local store.
    """
    data = JOB_STORE.get(job_id)
    if data:
        return AnalysisReport.model_validate_json(data)
    return None

def ask_chatbot(job_id: str, query: str) -> Optional[str]:
    """
    Queries the RAG database for a specific job_id and uses the LLM to answer the user's question.
    """
    from groq import Groq
    
    # 1. Retrieve Context from Qdrant
    rag_chunks = document_rag.query_document(job_id, query=query, limit=5)
    if not rag_chunks:
        return "I could not find any relevant information in the document to answer your question."
        
    context_text = "\n\n".join([f"Excerpt {i+1}:\n{chunk.get('text', '')}" for i, chunk in enumerate(rag_chunks)])
    
    # 2. Ask Groq
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    system_prompt = (
        "You are an AI assistant reviewing a Detailed Project Report (DPR). "
        "Answer the user's question based ONLY on the provided excerpts from the document. "
        "If the answer is not contained in the excerpts, say 'I don't have enough information from the document to answer that.'\n\n"
        f"Document Excerpts:\n{context_text}"
    )
    
    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            model=settings.GROQ_MODEL_NAME,
            temperature=0.3
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Chatbot Error: {e}")
        return f"An error occurred while generating the response: {str(e)}"
