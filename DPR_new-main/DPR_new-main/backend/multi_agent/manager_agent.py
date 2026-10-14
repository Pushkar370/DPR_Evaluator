import json
import logging
from typing import Dict, Any, List
from pydantic import BaseModel, Field

from backend.config import settings
from backend.schemas import ConflictItem, KeyProjectMetric, EvaluationSummary
from backend.llm_client import llm_pool

logger = logging.getLogger(__name__)

class ManagerPlanOutput(BaseModel):
    project_name: str = Field(default="Infrastructure Development Project")
    sector: str = Field(default="Infrastructure")
    primary_scope: str = Field(default="Civil construction and development")
    pillar_directives: Dict[str, str] = Field(default_factory=dict)

class ManagerReconcileOutput(BaseModel):
    project_name: str
    executive_summary: str
    slec_recommendation: str
    conflicts: List[ConflictItem] = Field(default_factory=list)
    key_metrics: List[KeyProjectMetric] = Field(default_factory=list)
    flagged_risks: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)

def plan_dpr_evaluation(dpr_text: str, total_pages: int) -> Dict[str, Any]:
    """
    Manager Agent creates the evaluation directives based on initial DPR content.
    Uses Gemini 1.5 Flash (with fallback to Groq).
    """
    logger.info("[MANAGER AGENT] Creating multi-agent evaluation plan...")
    initial_context = dpr_text[:18000]

    system_prompt = (
        "You are the Chief Coordinator of the MDoNER Infrastructure Review Board. "
        "Analyze the provided DPR opening sections and produce a tailored assessment plan "
        "for the 4 specialized pillar agents: Technical, Financial, Administrative, and Social."
    )

    user_prompt = (
        f"DPR INITIAL TEXT (Pages 1-5 approx):\n{initial_context}\n\n"
        f"Total Document Pages: {total_pages}\n\n"
        "Return a valid JSON object matching this schema:\n"
        "{\n"
        '  "project_name": "Inferred or explicit name of project",\n'
        '  "sector": "Roads/Bridges/Water/Healthcare/etc.",\n'
        '  "primary_scope": "Core objective and physical scope",\n'
        '  "pillar_directives": {\n'
        '    "Technical": "Specific engineering elements to scrutinize",\n'
        '    "Financial": "Specific cost and funding items to check",\n'
        '    "Administrative": "Specific clearance and timeline milestones to verify",\n'
        '    "Social": "Specific environmental and community impact points to assess"\n'
        '  }\n'
        "}"
    )

    try:
        if llm_pool.gemini_keys or llm_pool.groq_keys:
            plan_obj: ManagerPlanOutput = llm_pool.call_structured(
                ManagerPlanOutput,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                primary_provider="gemini"
            )
            return plan_obj.model_dump()
        else:
            return {
                "project_name": "Infrastructure Development Project",
                "sector": "General Infrastructure",
                "primary_scope": "DPR Compliance Review",
                "pillar_directives": {
                    "Technical": "Verify engineering specifications and BoQ items.",
                    "Financial": "Scrutinize total cost, contingencies, and funding share.",
                    "Administrative": "Verify land title and statutory clearances.",
                    "Social": "Assess EIA and community impact."
                }
            }
    except Exception as e:
        logger.error(f"[MANAGER PLAN] Failed via LLM: {e}. Using baseline plan.")
        return {
            "project_name": "Infrastructure Development Project",
            "sector": "General Infrastructure",
            "primary_scope": "DPR Review",
            "pillar_directives": {}
        }

def reconcile_and_finalize(
    plan: Dict[str, Any],
    technical_res: Dict[str, Any],
    financial_res: Dict[str, Any],
    admin_res: Dict[str, Any],
    social_res: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Manager Agent reconciles cross-pillar evaluations:
    1. Identifies cross-pillar contradictions (e.g. BoQ cost vs scope, timeline vs clearances).
    2. Computes the weighted overall score:
       Overall = 0.30*Tech + 0.30*Fin + 0.20*Admin + 0.20*Social.
    3. Issues final verdict: Approve / Revise / Reject.
    4. Generates executive summary and SLEC recommendation.
    """
    logger.info("[MANAGER AGENT] Reconciling pillar findings and computing weighted verdict...")

    # Extract individual scores
    tech_score = float(technical_res.get("score", 70.0))
    fin_score = float(financial_res.get("score", 70.0))
    admin_score = float(admin_res.get("score", 70.0))
    social_score = float(social_res.get("score", 70.0))

    # Calculate exact weighted score
    weighted_score = round(
        (tech_score * settings.WEIGHT_TECHNICAL) +
        (fin_score * settings.WEIGHT_FINANCIAL) +
        (admin_score * settings.WEIGHT_ADMINISTRATIVE) +
        (social_score * settings.WEIGHT_SOCIAL),
        1
    )

    # Build synthesis context for Manager LLM
    synthesis_data = {
        "project_name": plan.get("project_name", "Infrastructure Project"),
        "pillar_evaluations": {
            "Technical": {
                "score": tech_score,
                "summary": technical_res.get("summary", ""),
                "metrics": technical_res.get("metrics", {}),
                "findings": technical_res.get("findings", [])
            },
            "Financial": {
                "score": fin_score,
                "summary": financial_res.get("summary", ""),
                "metrics": financial_res.get("metrics", {}),
                "findings": financial_res.get("findings", [])
            },
            "Administrative": {
                "score": admin_score,
                "summary": admin_res.get("summary", ""),
                "metrics": admin_res.get("metrics", {}),
                "findings": admin_res.get("findings", [])
            },
            "Social": {
                "score": social_score,
                "summary": social_res.get("summary", ""),
                "metrics": social_res.get("metrics", {}),
                "findings": social_res.get("findings", [])
            }
        }
    }

    system_prompt = (
        "You are the Chief Assessor of the Ministry of Development of North Eastern Region (MDoNER) State Level Empowered Committee (SLEC). "
        "Review the 4 specialized evaluations (Technical, Financial, Administrative, Social) for this DPR. "
        "Your duties:\n"
        "1. Detect any cross-pillar contradictions (e.g. BoQ cost vs civil work scope, or land possession vs construction schedule).\n"
        "2. Resolve and document each conflict.\n"
        "3. Produce an executive summary and formal SLEC recommendation narrative.\n"
        "4. Extract 4-5 key project metrics for display in the executive scorecard.\n"
        "5. Aggregate the highest severity risks and actionable recommendations."
    )

    user_prompt = (
        f"SYNTHESIS DATA FROM 4 PILLARS:\n{json.dumps(synthesis_data, indent=2)}\n\n"
        f"COMPUTED OVERALL SCORE: {weighted_score}/100\n\n"
        "Return a valid JSON object matching this schema:\n"
        "{\n"
        '  "project_name": "Official Project Name",\n'
        '  "executive_summary": "Comprehensive executive overview (2-3 paragraphs)",\n'
        '  "slec_recommendation": "Formal SLEC recommendation paragraph",\n'
        '  "conflicts": [\n'
        '    {\n'
        '      "title": "Conflict Title",\n'
        '      "pillars_involved": ["Pillar A", "Pillar B"],\n'
        '      "description": "Nature of contradiction",\n'
        '      "resolution": "How the contradiction is reconciled",\n'
        '      "severity": "Low" | "Medium" | "High" | "Critical"\n'
        '    }\n'
        '  ],\n'
        '  "key_metrics": [\n'
        '    {"label": "Total Project Cost", "main_value": "₹XX Cr", "sub_details": ["Detail 1"]}\n'
        '  ],\n'
        '  "flagged_risks": ["Risk 1", "Risk 2"],\n'
        '  "recommendations": ["Recommendation 1", "Recommendation 2"]\n'
        "}"
    )

    conflicts = []
    key_metrics = []
    flagged_risks = []
    recommendations = []
    exec_summary = ""
    slec_rec = ""
    project_name = plan.get("project_name", "Infrastructure Project")

    try:
        if llm_pool.gemini_keys or llm_pool.groq_keys:
            reconcile_obj: ManagerReconcileOutput = llm_pool.call_structured(
                ManagerReconcileOutput,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                primary_provider="gemini"
            )
            exec_summary = reconcile_obj.executive_summary
            slec_rec = reconcile_obj.slec_recommendation
            project_name = reconcile_obj.project_name or project_name
            conflicts = [c.model_dump() for c in reconcile_obj.conflicts]
            key_metrics = [m.model_dump() for m in reconcile_obj.key_metrics]
            flagged_risks = reconcile_obj.flagged_risks
            recommendations = reconcile_obj.recommendations
    except Exception as e:
        logger.error(f"[MANAGER RECONCILE] Failed via LLM: {e}. Generating baseline synthesis.")

    # Determine Verdict based on strict rubric
    has_critical_blocker = any(c.get("severity") == "Critical" for c in conflicts)
    min_pillar_score = min(tech_score, fin_score, admin_score, social_score)

    if weighted_score >= 75.0 and min_pillar_score >= 60.0 and not has_critical_blocker:
        verdict = "Approve"
        if not slec_rec:
            slec_rec = f"The State Level Empowered Committee (SLEC) approves the DPR for '{project_name}' with a composite score of {weighted_score}/100, subject to standard compliance."
    elif weighted_score >= 50.0 and min_pillar_score >= 40.0:
        verdict = "Revise"
        if not slec_rec:
            slec_rec = f"The SLEC recommends revision of '{project_name}' (Composite Score: {weighted_score}/100). The implementing agency must address flagged gaps before resubmission."
    else:
        verdict = "Reject"
        if not slec_rec:
            slec_rec = f"The SLEC rejects '{project_name}' due to critical deficiencies and a low composite score of {weighted_score}/100."

    if not exec_summary:
        exec_summary = (
            f"Detailed Project Report review for '{project_name}' has been concluded by the multi-agent assessment system. "
            f"The evaluation encompassed Technical (30%), Financial (30%), Administrative (20%), and Social/Environmental (20%) dimensions. "
            f"Overall weighted compliance score is {weighted_score}/100 resulting in a verdict of {verdict}."
        )

    if not key_metrics:
        key_metrics = [
            {"label": "Overall Score", "main_value": f"{weighted_score}/100", "sub_details": [f"Verdict: {verdict}"]},
            {"label": "Technical", "main_value": f"{tech_score}/100", "sub_details": ["Weight: 30%"]},
            {"label": "Financial", "main_value": f"{fin_score}/100", "sub_details": ["Weight: 30%"]},
            {"label": "Admin & Social", "main_value": f"A:{admin_score} | S:{social_score}", "sub_details": ["Weights: 20% each"]}
        ]

    return {
        "project_name": project_name,
        "overall_score": weighted_score,
        "verdict": verdict,
        "executive_summary": exec_summary,
        "slec_recommendation": slec_rec,
        "conflicts": conflicts,
        "key_metrics": key_metrics,
        "flagged_risks": flagged_risks,
        "recommendations": recommendations,
        "pillar_scores": {
            "Technical": tech_score,
            "Financial": fin_score,
            "Administrative": admin_score,
            "Social": social_score
        }
    }
