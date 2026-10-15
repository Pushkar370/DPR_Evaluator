import logging
import time
from typing import Dict, Any

from langgraph.graph import StateGraph, START, END

from backend.multi_agent.state import DPRGraphState
from backend.multi_agent.manager_agent import plan_dpr_evaluation, reconcile_and_finalize
from backend.multi_agent.pillar_agents import (
    run_technical_agent,
    run_financial_agent,
    run_administrative_agent,
    run_social_agent
)
from backend.database import save_job_result

logger = logging.getLogger(__name__)

def plan_node(state: DPRGraphState) -> Dict[str, Any]:
    logger.info(f"--- [LANGGRAPH STEP 1] MANAGER PLANNING (Job {state.get('job_id')}) ---")
    plan = plan_dpr_evaluation(state.get("dpr_text", ""), state.get("total_pages", 1))
    return {"manager_plan": plan}

def technical_node(state: DPRGraphState) -> Dict[str, Any]:
    logger.info(f"--- [LANGGRAPH STEP 2A] TECHNICAL PILLAR EVALUATION (Job {state.get('job_id')}) ---")
    result = run_technical_agent(state.get("job_id", ""))
    return {"technical_result": result}

def financial_node(state: DPRGraphState) -> Dict[str, Any]:
    logger.info(f"--- [LANGGRAPH STEP 2B] FINANCIAL PILLAR EVALUATION (Job {state.get('job_id')}) ---")
    result = run_financial_agent(state.get("job_id", ""))
    return {"financial_result": result}

def admin_node(state: DPRGraphState) -> Dict[str, Any]:
    logger.info(f"--- [LANGGRAPH STEP 2C] ADMINISTRATIVE PILLAR EVALUATION (Job {state.get('job_id')}) ---")
    result = run_administrative_agent(state.get("job_id", ""))
    return {"admin_result": result}

def social_node(state: DPRGraphState) -> Dict[str, Any]:
    logger.info(f"--- [LANGGRAPH STEP 2D] SOCIAL & ENVIRONMENTAL PILLAR EVALUATION (Job {state.get('job_id')}) ---")
    result = run_social_agent(state.get("job_id", ""))
    return {"social_result": result}

def reconcile_node(state: DPRGraphState) -> Dict[str, Any]:
    logger.info(f"--- [LANGGRAPH STEP 3] MANAGER CONFLICT RESOLUTION & WEIGHTED SCORING (Job {state.get('job_id')}) ---")
    plan = state.get("manager_plan", {})
    tech = state.get("technical_result", {})
    fin = state.get("financial_result", {})
    admin = state.get("admin_result", {})
    social = state.get("social_result", {})

    reconciled = reconcile_and_finalize(plan, tech, fin, admin, social)
    pillar_scorecards = [tech, fin, admin, social]

    return {
        "pillar_scorecards": pillar_scorecards,
        "conflicts": reconciled.get("conflicts", []),
        "overall_score": reconciled.get("overall_score"),
        "verdict": reconciled.get("verdict"),
        "executive_summary": reconciled.get("executive_summary", ""),
        "slec_recommendation": reconciled.get("slec_recommendation", ""),
        "key_metrics": reconciled.get("key_metrics", []),
        "flagged_risks": reconciled.get("flagged_risks", []),
        "recommendations": reconciled.get("recommendations", [])
    }

def persist_node(state: DPRGraphState) -> Dict[str, Any]:
    logger.info(f"--- [LANGGRAPH STEP 4] PERSISTING EVALUATION RESULTS TO SQLITE (Job {state.get('job_id')}) ---")
    job_id = state.get("job_id")
    save_job_result(
        job_id=job_id,
        status="COMPLETED",
        overall_score=state.get("overall_score"),
        verdict=state.get("verdict"),
        processing_time=state.get("processing_time"),
        executive_summary=state.get("executive_summary"),
        slec_recommendation=state.get("slec_recommendation"),
        pillar_results=state.get("pillar_scorecards", []),
        conflicts=state.get("conflicts", [])
    )
    return {"error": None}

def build_dpr_graph():
    """Builds and compiles the LangGraph multi-agent workflow."""
    workflow = StateGraph(DPRGraphState)

    # Add Nodes
    workflow.add_node("plan", plan_node)
    workflow.add_node("technical", technical_node)
    workflow.add_node("financial", financial_node)
    workflow.add_node("administrative", admin_node)
    workflow.add_node("social", social_node)
    workflow.add_node("reconcile", reconcile_node)
    workflow.add_node("persist", persist_node)

    # Define Workflow Flow
    workflow.add_edge(START, "plan")

    # Fan out to parallel pillar agents
    workflow.add_edge("plan", "technical")
    workflow.add_edge("plan", "financial")
    workflow.add_edge("plan", "administrative")
    workflow.add_edge("plan", "social")

    # Fan in to manager reconciliation
    workflow.add_edge("technical", "reconcile")
    workflow.add_edge("financial", "reconcile")
    workflow.add_edge("administrative", "reconcile")
    workflow.add_edge("social", "reconcile")

    # Persist and finish
    workflow.add_edge("reconcile", "persist")
    workflow.add_edge("persist", END)

    return workflow.compile()

dpr_agent_app = build_dpr_graph()
