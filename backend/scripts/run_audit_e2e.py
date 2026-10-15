import requests
import time
import json
import os
import sys

def run_e2e_test():
    pdf_path = "real_DPR.pdf"
    if not os.path.exists(pdf_path):
        pdf_path = "Frontend-DPR/public/real_DPR.pdf"

    print(f"[TEST SETUP] Using test PDF: {pdf_path}")
    
    # 1. Upload
    with open(pdf_path, "rb") as f:
        res = requests.post("http://localhost:8000/upload", files={"file": ("real_DPR.pdf", f, "application/pdf")})
    
    assert res.status_code == 200, f"Upload failed ({res.status_code}): {res.text}"
    job_id = res.json()["job_id"]
    print(f"[UPLOAD SUCCESS] Job ID: {job_id}")

    # 2. Poll Status
    start = time.time()
    status = "PROCESSING"
    status_data = {}
    while time.time() - start < 180:
        s_res = requests.get(f"http://localhost:8000/status/{job_id}")
        assert s_res.status_code == 200
        status_data = s_res.json()
        status = status_data.get("status")
        elapsed = int(time.time() - start)
        print(f"  [POLL {elapsed:02d}s] Job {job_id} Status: {status}")
        if status in ["COMPLETED", "FAILED"]:
            break
        time.sleep(4)

    assert status == "COMPLETED", f"Job failed to complete: {status_data}"

    # 3. Fetch Full Report
    r_res = requests.get(f"http://localhost:8000/report/{job_id}")
    assert r_res.status_code == 200
    report = r_res.json()

    print("\n" + "="*60)
    print("           LIVE DPR EVALUATION REPORT AUDIT")
    print("="*60)
    print(f"Job ID:          {report.get('job_id')}")
    print(f"Overall Score:   {report.get('overall_score')}/100")
    print(f"Verdict:         {report.get('verdict')}")
    print(f"Processing Time: {report.get('processing_time')}s")
    print("\n--- 4 Pillar Scorecards ---")
    scorecards = report.get("pillar_scorecards", [])
    assert len(scorecards) == 4, f"Expected 4 pillar scorecards, got {len(scorecards)}"
    
    pillars_seen = set()
    total_findings = 0
    for sc in scorecards:
        p_name = sc["pillar"]
        pillars_seen.add(p_name)
        score = sc["score"]
        weight = sc["weight"]
        findings = sc.get("findings", [])
        total_findings += len(findings)
        print(f"  • {p_name.upper():<15}: {score:>5.1f}/100 (Weight: {weight*100:.0f}%) | Findings: {len(findings)}")
        for f in findings[:2]:
            page = f.get("dpr_page", 0)
            assert page > 0, f"Finding missing valid page number: {f}"
            print(f"      - [DPR Page {page}] [{f.get('category')}] {f.get('description')[:75]}...")

    assert pillars_seen == {"Technical", "Financial", "Administrative", "Social"}, f"Missing pillars: {pillars_seen}"
    assert total_findings > 0, "No findings generated"

    print("\n--- Manager Cross-Pillar Conflict Reconciliation ---")
    conflicts = report.get("conflicts", [])
    print(f"Detected & Reconciled Conflicts: {len(conflicts)}")
    for c in conflicts:
        print(f"  • [{c.get('title')}] (Pillars: {', '.join(c.get('pillars_involved', []))})")
        print(f"    Resolution: {c.get('resolution')[:85]}...")

    print("\n--- Persistent SQLite Audit Check ---")
    h_res = requests.get("http://localhost:8000/reports")
    assert h_res.status_code == 200
    history = h_res.json().get("jobs", [])
    matched_job = next((j for j in history if j["job_id"] == job_id), None)
    assert matched_job is not None, "Job was not saved to SQLite history!"
    print(f"[SQLITE VERIFIED] Job {job_id} successfully stored with score {matched_job.get('overall_score')}")

    print("\n" + "="*60)
    print("   ALL AUDIT CRITERIA SATISFIED WITH 100% SUCCESS!")
    print("="*60)

if __name__ == "__main__":
    run_e2e_test()
