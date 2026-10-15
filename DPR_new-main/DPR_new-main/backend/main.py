"""
FastAPI backend for DPR Compliance Analysis System.
Orchestrates LangGraph Multi-Agent Evaluation, SQLite Persistence, and RAG.
"""

import sys
import uuid
import asyncio
from pathlib import Path
from typing import Optional, List, Dict, Any

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.schemas import (
    UploadResponse,
    StatusResponse,
    AnalysisReport,
    ChatRequest,
    ChatResponse,
    HistoryResponse,
    HistoryItem,
    PillarScorecard,
    ConflictItem
)
from backend.config import settings
from backend.services import (
    process_dpr_file,
    get_job_status,
    ask_chatbot
)
from backend.database import list_jobs, get_guideline_stats
from backend.guidelines_service import ingest_all_guidelines
from backend.rag_service import document_rag

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for analyzing government DPR documents via LangGraph Multi-Agent RAG System",
    version=settings.VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    expose_headers=["*"],
    allow_headers=["*"],
)

UPLOADS_DIR = Path(settings.UPLOADS_DIR)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "multi_agent_framework": "LangGraph",
        "guidelines_loaded": document_rag.has_guidelines()
    }

@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported (.pdf)")

    try:
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes)")
        if len(contents) > 100 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File size exceeds maximum limit of 100MB")

        job_id = str(uuid.uuid4())[:8].upper()
        file_path = UPLOADS_DIR / f"{job_id}_{file.filename}"
        
        with open(file_path, 'wb') as f:
            f.write(contents)
        
        if background_tasks:
            background_tasks.add_task(
                process_dpr_file,
                job_id,
                str(file_path)
            )

        return UploadResponse(job_id=job_id, message="File uploaded successfully. Multi-agent analysis initiated.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@app.get("/status/{job_id}", response_model=StatusResponse)
async def check_status(job_id: str):
    report = get_job_status(job_id)
    if report is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    
    return StatusResponse(
        job_id=job_id,
        status=report.status,
        report=report if report.status in ["COMPLETED", "FAILED"] else None
    )

@app.get("/report/{job_id}", response_model=AnalysisReport)
async def get_report(job_id: str):
    report = get_job_status(job_id)
    if report is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    
    if report.status == "PROCESSING":
        raise HTTPException(status_code=202, detail="Job is still processing.")
    
    return report

@app.get("/reports", response_model=HistoryResponse)
async def get_all_reports(limit: int = 50):
    """Fetches job history directly from SQLite database."""
    jobs = list_jobs(limit=limit)
    history_items = [
        HistoryItem(
            job_id=j["job_id"],
            filename=j["filename"],
            status=j["status"],
            overall_score=j.get("overall_score"),
            verdict=j.get("verdict"),
            processing_time=j.get("processing_time"),
            created_at=str(j.get("created_at")),
            updated_at=str(j.get("updated_at"))
        )
        for j in jobs
    ]
    return HistoryResponse(jobs=history_items)

@app.get("/report/{job_id}/pillars", response_model=List[PillarScorecard])
async def get_pillar_scorecards(job_id: str):
    report = get_job_status(job_id)
    if report is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    return report.pillar_scorecards

@app.get("/report/{job_id}/conflicts", response_model=List[ConflictItem])
async def get_job_conflicts(job_id: str):
    report = get_job_status(job_id)
    if report is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    return report.conflicts

@app.post("/guidelines/ingest")
async def trigger_guidelines_ingestion():
    """Triggers indexing of all guideline PDFs in the guidelines/ folder."""
    result = ingest_all_guidelines()
    return result

@app.get("/guidelines/status")
async def get_guidelines_status():
    """Returns the current ingestion status of guidelines per pillar."""
    stats = get_guideline_stats()
    return {
        "has_guidelines": document_rag.has_guidelines(),
        "pillar_stats": stats,
        "guidelines_dir": settings.GUIDELINES_DIR
    }

@app.post("/chat", response_model=ChatResponse)
async def chat_with_document(request: ChatRequest):
    try:
        answer = ask_chatbot(request.job_id, request.query)
        return ChatResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {
        "message": settings.APP_NAME,
        "framework": "LangGraph Multi-Agent (5 Agents: 4 Pillars + 1 Manager)",
        "docs": "http://localhost:8000/docs",
        "endpoints": {
            "health": "GET /health",
            "upload": "POST /upload",
            "status": "GET /status/{job_id}",
            "report": "GET /report/{job_id}",
            "reports_history": "GET /reports",
            "pillars": "GET /report/{job_id}/pillars",
            "conflicts": "GET /report/{job_id}/conflicts",
            "guidelines_status": "GET /guidelines/status",
            "guidelines_ingest": "POST /guidelines/ingest",
            "chat": "POST /chat"
        }
    }

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "detail": str(exc)}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
