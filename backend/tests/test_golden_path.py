import os
import time
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services import process_dpr_file
from backend.database import init_db

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    init_db()

def test_golden_path_flow():
    # 1. Health check
    health_res = client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "healthy"
    assert health_res.json()["multi_agent_framework"] == "LangGraph"

    # 2. Upload sample DPR
    pdf_path = "real_DPR.pdf"
    assert os.path.exists(pdf_path), f"Sample {pdf_path} not found. Run generate_dpr.py first."

    with open(pdf_path, "rb") as f:
        upload_res = client.post("/upload", files={"file": ("real_DPR.pdf", f, "application/pdf")})
    assert upload_res.status_code == 200
    job_id = upload_res.json()["job_id"]
    assert len(job_id) > 0

    # Process synchronously for testing to verify exact pipeline
    process_dpr_file(job_id, pdf_path)

    # 3. Check Status
    status_res = client.get(f"/status/{job_id}")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["status"] == "COMPLETED"
    assert status_data["report"] is not None

    # 4. Check Full Report
    report_res = client.get(f"/report/{job_id}")
    assert report_res.status_code == 200
    report = report_res.json()
    assert report["job_id"] == job_id
    assert report["status"] == "COMPLETED"
    assert report["overall_score"] is not None
    assert 0.0 <= report["overall_score"] <= 100.0
    assert report["verdict"] in ["Approve", "Revise", "Reject"]

    # Verify 4 Pillar Scorecards
    scorecards = report["pillar_scorecards"]
    assert len(scorecards) == 4
    pillar_names = [s["pillar"] for s in scorecards]
    assert "Technical" in pillar_names
    assert "Financial" in pillar_names
    assert "Administrative" in pillar_names
    assert "Social" in pillar_names

    # Verify Findings have DPR page numbers
    for sc in scorecards:
        assert 0.0 <= sc["score"] <= 100.0
        for finding in sc.get("findings", []):
            assert "dpr_page" in finding
            assert isinstance(finding["dpr_page"], int)

    # 5. Check Reports History Endpoint
    history_res = client.get("/reports")
    assert history_res.status_code == 200
    jobs = history_res.json()["jobs"]
    job_ids = [j["job_id"] for j in jobs]
    assert job_id in job_ids

    # 6. Check Pillars Endpoint
    pillars_res = client.get(f"/report/{job_id}/pillars")
    assert pillars_res.status_code == 200
    assert len(pillars_res.json()) == 4

    # 7. Check Chatbot Endpoint
    chat_res = client.post("/chat", json={"job_id": job_id, "query": "What is the total project cost?"})
    assert chat_res.status_code == 200
    assert len(chat_res.json()["answer"]) > 0
