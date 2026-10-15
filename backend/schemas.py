"""
Pydantic schemas for DPR compliance analysis API.
Defines data structures for request/response validation across LangGraph multi-agent flow.
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any


class DynamicInsight(BaseModel):
    """Schema for a dynamically generated key insight (backward compatibility)."""
    topic: str = Field(..., description="The focus area of this insight")
    details: str = Field(..., description="Detailed narrative about this topic")
    risks: List[str] = Field(default_factory=list, description="Any risks associated with this topic")
    extracted_values: Dict[str, Any] = Field(default_factory=dict, description="Key extracted numerical values and costs")


class KeyProjectMetric(BaseModel):
    """Metric displayed in the UI summary card."""
    label: str = Field(..., description="The label for the metric")
    main_value: str = Field(..., description="Primary display value")
    sub_details: List[str] = Field(default_factory=list, description="Optional secondary details")


class FindingItem(BaseModel):
    """A granular finding cited with exact DPR page and guideline reference."""
    pillar: str = Field(..., description="Technical, Financial, Administrative, or Social")
    category: str = Field(default="Finding", description="Strength, Risk, Deficiency, or Compliance Gap")
    description: str = Field(..., description="Detailed finding explanation")
    dpr_page: int = Field(..., description="Exact DPR page number where finding was located")
    guideline_reference: Optional[str] = Field(default=None, description="NE-SIDS/MDoNER guideline clause or 'Unverified'")
    severity: str = Field(default="Medium", description="Low, Medium, High, or Critical")


class ConflictItem(BaseModel):
    """A cross-pillar contradiction identified and reconciled by the Manager agent."""
    title: str = Field(..., description="Short title of the conflict")
    pillars_involved: List[str] = Field(default_factory=list, description="Pillars with contradicting information")
    description: str = Field(..., description="Explanation of the contradiction found in DPR")
    resolution: str = Field(..., description="Manager's reconciliation decision and verdict impact")
    severity: str = Field(default="Medium", description="Low, Medium, High, or Critical")


class PillarScorecard(BaseModel):
    """Individual pillar evaluation scorecard."""
    pillar: Optional[str] = Field(default="Pillar", description="Technical, Financial, Administrative, or Social")
    score: float = Field(..., description="Score out of 100")
    weight: float = Field(default=0.25, description="Weight factor in overall calculation (e.g. 0.30)")
    summary: str = Field(..., description="Narrative evaluation for this pillar")
    guidelines_status: str = Field(default="Unverified", description="Verified or Unverified")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Extracted quantitative metrics")
    findings: List[FindingItem] = Field(default_factory=list, description="Pillar-specific findings with page citations")


class EvaluationSummary(BaseModel):
    """Schema for final AI assessment report card."""
    project_name: Optional[str] = Field(default="Unknown Project", description="Extracted name of the project")
    approval_status: Optional[str] = Field(default="Pending Review", description="Approve, Revise, or Reject")
    overall_score: Optional[float] = Field(default=None, description="Final weighted composite score (0-100)")
    pillar_scores: Dict[str, float] = Field(default_factory=dict, description="Individual pillar scores {Technical: 85, ...}")
    slec_recommendation: Optional[str] = Field(default="", description="Narrative paragraph detailing recommendation")
    key_project_metrics: List[KeyProjectMetric] = Field(default_factory=list, description="Critical project metrics")
    flagged_risks: List[str] = Field(default_factory=list, description="Aggregated risks")
    missing_sections: List[str] = Field(default_factory=list, description="Critical blind spots or missing data")
    recommendations: List[str] = Field(default_factory=list, description="Actionable recommendations")


class AnalysisReport(BaseModel):
    """Complete dynamic analysis report schema."""
    job_id: str = Field(..., description="Unique identifier for the analysis job")
    status: str = Field(default="PROCESSING", description="Job status: PROCESSING, COMPLETED, or FAILED")
    overall_score: Optional[float] = Field(default=None, description="Final weighted score out of 100")
    verdict: Optional[str] = Field(default=None, description="Approve, Revise, or Reject")
    executive_summary: str = Field(default="", description="High-level narrative overview of the DPR")
    evaluation_summary: Optional[EvaluationSummary] = Field(default=None, description="Final AI Assessment Report Card")
    pillar_scorecards: List[PillarScorecard] = Field(default_factory=list, description="Detailed scorecards for each pillar")
    conflicts: List[ConflictItem] = Field(default_factory=list, description="Cross-pillar conflicts reconciled by Manager")
    insights: List[DynamicInsight] = Field(default_factory=list, description="Dynamic insights (backward compatibility)")
    extracted_images: List[Dict[str, str]] = Field(default_factory=list, description="List of images extracted from PDF")
    error_message: Optional[str] = Field(default=None, description="Error details if status is FAILED")
    ocr_text: Optional[str] = Field(default=None, description="Raw extracted text (optional)")
    processing_time: Optional[float] = Field(default=None, description="Time taken to process in seconds")
    current_step: Optional[str] = Field(default=None, description="Current evaluation pipeline stage")


class UploadResponse(BaseModel):
    job_id: str = Field(..., description="Job ID to track status")
    message: str = Field(default="File uploaded successfully", description="Confirmation message")


class StatusResponse(BaseModel):
    job_id: str = Field(..., description="Job ID")
    status: str = Field(..., description="Current job status")
    current_step: Optional[str] = Field(default=None, description="Active pipeline stage description")
    report: Optional[AnalysisReport] = Field(default=None, description="Full analysis report if completed")


class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error message")
    details: Optional[str] = Field(default=None, description="Additional error details")


class ChatRequest(BaseModel):
    job_id: str = Field(..., description="The ID of the document being discussed")
    query: str = Field(..., description="User question")


class ChatResponse(BaseModel):
    answer: str = Field(..., description="Answer from AI assistant")


class HistoryItem(BaseModel):
    job_id: str
    filename: str
    status: str
    overall_score: Optional[float] = None
    verdict: Optional[str] = None
    processing_time: Optional[float] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class HistoryResponse(BaseModel):
    jobs: List[HistoryItem]


class GeospatialVerificationReport(BaseModel):
    job_id: str = Field(..., description="Job identifier")
    project_title: str = Field(default="Infrastructure Project", description="Full project name")
    place_name: str = Field(default="Project Site", description="Town, City, or Corridor name")
    state: str = Field(default="State", description="Indian State")
    district: str = Field(default="District", description="District name")
    lat: float = Field(default=26.1445, description="Primary site latitude in decimal degrees (e.g. 28.6139 for Delhi, 33.3129 for J&K, 25.5788 for Meghalaya)")
    lng: float = Field(default=91.7362, description="Primary site longitude in decimal degrees (e.g. 77.2090 for Delhi, 75.7661 for J&K, 91.8933 for Meghalaya)")
    zoom_level: int = Field(default=13, description="Recommended map zoom level")
    project_type: str = Field(default="Highway / Bridge", description="Infrastructure sector")
    site_area_acres: float = Field(default=15.0, description="Estimated total area in acres")
    project_boundary: List[List[float]] = Field(default_factory=list, description="Array of [lat, lng] vertices")
    restricted_zone_name: str = Field(default="Restricted Environmental Zone", description="Zone designation")
    restricted_zone_type: str = Field(default="Forest / Eco-Sensitive Zone", description="Type of restriction")
    restricted_zone_boundary: List[List[float]] = Field(default_factory=list, description="Array of [lat, lng] vertices")
    has_overlap_conflict: bool = Field(default=False, description="Whether site encroaches on restricted zone")
    overlap_area_acres: float = Field(default=0.0, description="Area of encroachment in acres")
    overlap_percentage: float = Field(default=0.0, description="Percentage of project site overlapping")
    overlap_boundary: List[List[float]] = Field(default_factory=list, description="Array of [lat, lng] vertices forming the overlap intersection polygon")
    seismic_zone: str = Field(default="Zone V", description="Seismic hazard classification")
    water_body_status: str = Field(default="Outside 50m river buffer", description="Proximity to drainage/rivers")
    forest_clearance_status: str = Field(default="Verified - Stage I Clear", description="Forest conservation clearance")
    compliance_status: str = Field(default="COMPLIANT", description="COMPLIANT, REQUIRES_REVIEW, or NON_COMPLIANT")
    key_findings: List[str] = Field(default_factory=list, description="2-3 specific page-cited findings")
