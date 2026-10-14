import os
import time
import logging
from typing import Dict, Any, Optional, List

from backend.config import settings
from backend.schemas import (
    AnalysisReport,
    EvaluationSummary,
    KeyProjectMetric,
    PillarScorecard,
    FindingItem,
    ConflictItem,
    DynamicInsight
)
from backend.extraction import extract_document_flexible
from backend.rag_service import document_rag
from backend.multi_agent.graph import dpr_agent_app
from backend.database import (
    init_db,
    create_job,
    update_job_status,
    save_job_result,
    get_job,
    list_jobs
)
from backend.llm_client import llm_pool

logger = logging.getLogger(__name__)

# Ensure DB is ready
init_db()

def process_dpr_task(job_id: str, pdf_path: str):
    """
    Executes the complete DPR pipeline:
    Extraction -> Vector Ingestion -> LangGraph Multi-Agent Evaluation -> SQLite Persistence.
    """
    start_time = time.time()
    filename = os.path.basename(pdf_path)
    logger.info(f"[JOB STARTED] Processing job {job_id} ({filename})")
    
    # Record job in SQLite
    create_job(job_id, filename, pdf_path)

    try:
        # Step 1: Flexible Document Extraction (with OCR fallback)
        logger.info(f"[JOB EXTRACTING] Extracting text & images for {job_id}")
        extraction_result = extract_document_flexible(pdf_path, job_id)
        extracted_text = extraction_result["text_markdown"]
        total_pages = extraction_result.get("total_pages", 1)
        
        # Step 2: Vector Ingestion into Qdrant
        logger.info(f"[JOB INGESTING] Vectorizing chunks for {job_id}")
        document_rag.ingest_document(job_id, extracted_text)
        
        # Step 3: LangGraph Multi-Agent Execution
        logger.info(f"[JOB LANGGRAPH] Invoking LangGraph Multi-Agent workflow for {job_id}")
        initial_state = {
            "job_id": job_id,
            "pdf_path": pdf_path,
            "dpr_text": extracted_text,
            "total_pages": total_pages,
            "images": extraction_result.get("images", []),
            "has_guidelines": document_rag.has_guidelines()
        }
        
        final_state = dpr_agent_app.invoke(initial_state)
        processing_time = round(time.time() - start_time, 2)
        final_state["processing_time"] = processing_time
        
        # Step 4: Ensure saved in DB
        save_job_result(
            job_id=job_id,
            status="COMPLETED",
            overall_score=final_state.get("overall_score"),
            verdict=final_state.get("verdict"),
            processing_time=processing_time,
            executive_summary=final_state.get("executive_summary"),
            slec_recommendation=final_state.get("slec_recommendation"),
            pillar_results=final_state.get("pillar_scorecards", []),
            conflicts=final_state.get("conflicts", [])
        )
        logger.info(f"[JOB COMPLETED] {job_id} successfully completed in {processing_time}s")

    except Exception as e:
        processing_time = round(time.time() - start_time, 2)
        logger.error(f"[JOB FAILED] {job_id} failed after {processing_time}s: {e}")
        update_job_status(job_id, status="FAILED", error_message=str(e), processing_time=processing_time)

def process_dpr_file(job_id: str, pdf_path: str):
    """Trigger function called by FastAPI background tasks."""
    process_dpr_task(job_id, pdf_path)

def get_job_status(job_id: str) -> Optional[AnalysisReport]:
    """
    Fetches job record from SQLite and formats into AnalysisReport schema.
    """
    job_data = get_job(job_id)
    if not job_data:
        return None

    report = AnalysisReport(
        job_id=job_id,
        status=job_data["status"],
        overall_score=job_data.get("overall_score"),
        verdict=job_data.get("verdict"),
        executive_summary=job_data.get("executive_summary") or "",
        error_message=job_data.get("error_message"),
        processing_time=job_data.get("processing_time")
    )

    if job_data["status"] == "COMPLETED":
        # Format Pillar Scorecards
        scorecards = []
        pillar_scores = {}
        for p in job_data.get("pillar_evaluations", []):
            pillar_name = p.get("pillar", "")
            score = float(p.get("score", 0.0))
            pillar_scores[pillar_name] = score
            
            # Match findings for this pillar
            p_findings = [
                FindingItem(
                    pillar=f.get("pillar", ""),
                    category=f.get("category", "Finding"),
                    description=f.get("description", ""),
                    dpr_page=f.get("dpr_page", 1),
                    guideline_reference=f.get("guideline_reference"),
                    severity=f.get("severity", "Medium")
                )
                for f in job_data.get("findings", []) if f.get("pillar") == pillar_name
            ]

            scorecards.append(PillarScorecard(
                pillar=pillar_name,
                score=score,
                weight=float(p.get("weight", 0.25)),
                summary=p.get("summary", ""),
                guidelines_status=p.get("guidelines_status", "Unverified"),
                metrics=p.get("metrics", {}),
                findings=p_findings
            ))

        report.pillar_scorecards = scorecards

        # Format Conflicts
        conflicts = [
            ConflictItem(
                title=c.get("title", ""),
                pillars_involved=c.get("pillars_involved", []),
                description=c.get("description", ""),
                resolution=c.get("resolution", ""),
                severity=c.get("severity", "Medium")
            )
            for c in job_data.get("conflicts", [])
        ]
        report.conflicts = conflicts

        # Format Evaluation Summary
        key_metrics = [
            KeyProjectMetric(
                label="Overall Compliance Score",
                main_value=f"{job_data.get('overall_score') or 0}/100",
                sub_details=[f"Verdict: {job_data.get('verdict') or 'Under Review'}"]
            ),
            KeyProjectMetric(
                label="Technical Score",
                main_value=f"{pillar_scores.get('Technical', 0)}/100",
                sub_details=["Weight: 30%"]
            ),
            KeyProjectMetric(
                label="Financial Score",
                main_value=f"{pillar_scores.get('Financial', 0)}/100",
                sub_details=["Weight: 30%"]
            ),
            KeyProjectMetric(
                label="Administrative & Social",
                main_value=f"A: {pillar_scores.get('Administrative', 0)} | S: {pillar_scores.get('Social', 0)}",
                sub_details=["Weight: 20% each"]
            )
        ]

        report.evaluation_summary = EvaluationSummary(
            project_name=job_data.get("filename", "Detailed Project Report"),
            approval_status=job_data.get("verdict", "Under Review"),
            overall_score=job_data.get("overall_score"),
            pillar_scores=pillar_scores,
            slec_recommendation=job_data.get("slec_recommendation") or "",
            key_project_metrics=key_metrics,
            flagged_risks=[f.description for f in report.pillar_scorecards for f in f.findings if f.severity in ["High", "Critical"]],
            missing_sections=[f.description for f in report.pillar_scorecards for f in f.findings if f.category == "Deficiency"],
            recommendations=[f"Address {c.title}: {c.resolution}" for c in conflicts]
        )

        # Backward-compatible dynamic insights
        insights = []
        for card in scorecards:
            insights.append(DynamicInsight(
                topic=f"{card.pillar} Evaluation (Score: {card.score}/100)",
                details=card.summary,
                risks=[f.description for f in card.findings if f.severity in ["High", "Critical"]],
                extracted_values={k: str(v) for k, v in card.metrics.items()}
            ))
        report.insights = insights

    return report

def ask_chatbot(job_id: str, query: str) -> Optional[str]:
    """
    Answers user questions over DPR document context and guidelines using LLM pool.
    """
    rag_chunks = document_rag.query_document(job_id, query=query, limit=6)
    if not rag_chunks:
        return "I could not find relevant information in the document to answer your question."
        
    context_text = "\n\n".join([f"[Page {chunk.get('page', '?')}]:\n{chunk.get('text', '')}" for chunk in rag_chunks])
    
    system_prompt = (
        "You are an expert AI review assistant for Detailed Project Reports (DPR). "
        "Answer the user's question based strictly on the provided document excerpts. "
        "Always cite the DPR page numbers when providing specific figures or facts. "
        "If the answer is not present, clearly state that the document does not contain that information."
    )
    user_prompt = f"DOCUMENT EXCERPTS:\n{context_text}\n\nUSER QUESTION: {query}"

    try:
        if llm_pool.groq_keys:
            return llm_pool.call_groq(system_prompt, user_prompt, json_mode=False)
        elif llm_pool.gemini_keys:
            return llm_pool.call_gemini(system_prompt, user_prompt, json_mode=False)
        else:
            return f"Retrieved relevant excerpts from DPR:\n\n{context_text}"
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        return f"An error occurred while generating response: {str(e)}"
