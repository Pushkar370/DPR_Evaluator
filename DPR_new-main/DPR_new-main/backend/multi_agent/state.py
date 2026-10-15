from typing import TypedDict, List, Dict, Any, Optional

class DPRGraphState(TypedDict, total=False):
    job_id: str
    pdf_path: str
    dpr_text: str
    total_pages: int
    images: List[Dict[str, Any]]
    has_guidelines: bool
    
    # Manager outputs
    manager_plan: Dict[str, Any]
    
    # Pillar outputs
    technical_result: Optional[Dict[str, Any]]
    financial_result: Optional[Dict[str, Any]]
    admin_result: Optional[Dict[str, Any]]
    social_result: Optional[Dict[str, Any]]
    
    # Reconciled results
    pillar_scorecards: List[Dict[str, Any]]
    conflicts: List[Dict[str, Any]]
    overall_score: Optional[float]
    verdict: Optional[str]
    slec_recommendation: str
    executive_summary: str
    key_metrics: List[Dict[str, Any]]
    flagged_risks: List[str]
    recommendations: List[str]
    
    error: Optional[str]
