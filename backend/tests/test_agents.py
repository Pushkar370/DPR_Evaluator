import pytest
from backend.multi_agent.pillar_agents import (
    run_technical_agent,
    run_financial_agent,
    run_administrative_agent,
    run_social_agent
)
from backend.multi_agent.manager_agent import (
    plan_dpr_evaluation,
    reconcile_and_finalize
)
from backend.rag_service import document_rag

@pytest.fixture(scope="module")
def sample_dpr_ingested():
    job_id = "TEST_AGENT_01"
    sample_text = (
        "## Page 1\n"
        "Detailed Project Report (DPR) for Construction of 4-Lane Bridge Over River Yamuna.\n"
        "The project aims to construct an extradosed cable-stayed bridge of length 1.2 km.\n"
        "Total estimated cost is Rs. 450 Crores with proposed completion timeline of 36 months.\n\n"
        "## Page 2\n"
        "Technical Specifications: Foundation involves deep pile foundation in alluvial soil.\n"
        "Pavement design follows IRC:37 for 150 MSA traffic. Concrete grade M25 adheres to IS 456.\n\n"
        "## Page 3\n"
        "Bill of Quantities (BoQ) & Cost Breakdown:\n"
        "Substructure: Rs. 120.50 Crores, Superstructure: Rs. 180.00 Crores, Approach Roads: Rs. 85.50 Cr.\n"
        "Contingency: Rs. 40.00 Crores. Total: Rs. 450.00 Crores.\n\n"
        "## Page 4\n"
        "Environmental and Social Impact Assessment (ESIA):\n"
        "Diversion of 2.5 hectares of forest land required. Compensatory afforestation ratio 1:10.\n"
        "EMP cost allocated strictly is Rs. 15 Crores. No residential displacement.\n\n"
        "## Page 5\n"
        "Administrative & Clearances:\n"
        "State PWD is the implementing agency. Environmental Clearance Stage-I obtained from MoEFCC."
    )
    document_rag.ingest_document(job_id, sample_text)
    return job_id, sample_text

def test_manager_plan(sample_dpr_ingested):
    job_id, sample_text = sample_dpr_ingested
    plan = plan_dpr_evaluation(sample_text, total_pages=5)
    assert isinstance(plan, dict)
    assert "project_name" in plan
    assert "sector" in plan

def test_technical_agent(sample_dpr_ingested):
    job_id, _ = sample_dpr_ingested
    res = run_technical_agent(job_id)
    assert res["pillar"] == "Technical"
    assert 0.0 <= res["score"] <= 100.0
    assert res["weight"] == 0.30
    assert len(res["summary"]) > 0
    assert isinstance(res["findings"], list)
    for f in res["findings"]:
        assert "dpr_page" in f
        assert isinstance(f["dpr_page"], int)

def test_financial_agent(sample_dpr_ingested):
    job_id, _ = sample_dpr_ingested
    res = run_financial_agent(job_id)
    assert res["pillar"] == "Financial"
    assert 0.0 <= res["score"] <= 100.0
    assert res["weight"] == 0.30
    assert len(res["summary"]) > 0

def test_administrative_agent(sample_dpr_ingested):
    job_id, _ = sample_dpr_ingested
    res = run_administrative_agent(job_id)
    assert res["pillar"] == "Administrative"
    assert 0.0 <= res["score"] <= 100.0
    assert res["weight"] == 0.20
    assert len(res["summary"]) > 0

def test_social_agent(sample_dpr_ingested):
    job_id, _ = sample_dpr_ingested
    res = run_social_agent(job_id)
    assert res["pillar"] == "Social"
    assert 0.0 <= res["score"] <= 100.0
    assert res["weight"] == 0.20
    assert len(res["summary"]) > 0

def test_manager_reconciliation():
    plan = {"project_name": "Yamuna Bridge Project"}
    tech = {"score": 82.0, "summary": "Sound design", "metrics": {}, "findings": []}
    fin = {"score": 80.0, "summary": "Realistic budget", "metrics": {}, "findings": []}
    admin = {"score": 85.0, "summary": "Good clearances", "metrics": {}, "findings": []}
    social = {"score": 75.0, "summary": "EMP in place", "metrics": {}, "findings": []}

    reconciled = reconcile_and_finalize(plan, tech, fin, admin, social)
    # Expected weighted score: (82*0.3) + (80*0.3) + (85*0.2) + (75*0.2) = 24.6 + 24.0 + 17.0 + 15.0 = 80.6
    assert abs(reconciled["overall_score"] - 80.6) < 0.2
    assert reconciled["verdict"] in ["Approve", "Revise", "Reject"]
    assert len(reconciled["executive_summary"]) > 0
    assert len(reconciled["slec_recommendation"]) > 0
