import sqlite3
import json
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

from backend.config import settings

logger = logging.getLogger(__name__)

def get_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    path = db_path or settings.SQLITE_DB_PATH
    conn = sqlite3.connect(path, timeout=30.0)
    conn.row_factory = sqlite3.Row
    # Enable WAL mode for high concurrency
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

def init_db(db_path: Optional[str] = None):
    """Initializes the SQLite database tables."""
    conn = get_connection(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            job_id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            status TEXT NOT NULL, -- PROCESSING, COMPLETED, FAILED
            current_step TEXT,
            overall_score REAL,
            verdict TEXT,         -- Approve, Revise, Reject
            processing_time REAL,
            executive_summary TEXT,
            slec_recommendation TEXT,
            error_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Migration helper for current_step and geospatial_json columns
        try:
            cursor.execute("ALTER TABLE jobs ADD COLUMN current_step TEXT;")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE jobs ADD COLUMN geospatial_json TEXT;")
        except Exception:
            pass

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS pillar_evaluations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id TEXT NOT NULL,
            pillar TEXT NOT NULL, -- Technical, Financial, Administrative, Social
            score REAL NOT NULL,
            weight REAL NOT NULL,
            summary TEXT NOT NULL,
            guidelines_status TEXT NOT NULL, -- Verified, Unverified - Missing Guidelines
            metrics_json TEXT,
            FOREIGN KEY(job_id) REFERENCES jobs(job_id) ON DELETE CASCADE
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS findings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id TEXT NOT NULL,
            pillar TEXT NOT NULL,
            category TEXT NOT NULL, -- Strength, Risk, Deficiency, Compliance Gap
            description TEXT NOT NULL,
            dpr_page INTEGER NOT NULL,
            guideline_reference TEXT,
            severity TEXT NOT NULL, -- Low, Medium, High, Critical
            FOREIGN KEY(job_id) REFERENCES jobs(job_id) ON DELETE CASCADE
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS conflicts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id TEXT NOT NULL,
            title TEXT NOT NULL,
            pillars_involved TEXT NOT NULL, -- JSON array
            description TEXT NOT NULL,
            resolution TEXT NOT NULL,
            severity TEXT NOT NULL, -- Low, Medium, High, Critical
            FOREIGN KEY(job_id) REFERENCES jobs(job_id) ON DELETE CASCADE
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS guideline_meta (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pillar TEXT NOT NULL,
            filename TEXT NOT NULL,
            total_pages INTEGER DEFAULT 0,
            total_chunks INTEGER DEFAULT 0,
            ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        conn.commit()
        logger.info(f"[DB] Initialized database schema at {db_path or settings.SQLITE_DB_PATH}")
    finally:
        conn.close()

def create_job(job_id: str, filename: str, file_path: str, initial_step: str = "1/5: Document Extraction & OCR", db_path: Optional[str] = None):
    conn = get_connection(db_path)
    try:
        with conn:
            conn.execute(
                """
                INSERT INTO jobs (job_id, filename, file_path, status, current_step, created_at, updated_at)
                VALUES (?, ?, ?, 'PROCESSING', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT(job_id) DO UPDATE SET
                    status = 'PROCESSING',
                    current_step = excluded.current_step,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (job_id, filename, file_path, initial_step)
            )
    finally:
        conn.close()

def update_job_status(job_id: str, status: str, current_step: Optional[str] = None, error_message: Optional[str] = None, processing_time: Optional[float] = None, db_path: Optional[str] = None):
    conn = get_connection(db_path)
    try:
        with conn:
            conn.execute(
                """
                UPDATE jobs
                SET status = ?,
                    current_step = COALESCE(?, current_step),
                    error_message = ?,
                    processing_time = COALESCE(?, processing_time),
                    updated_at = CURRENT_TIMESTAMP
                WHERE job_id = ?
                """,
                (status, current_step, error_message, processing_time, job_id)
            )
    finally:
        conn.close()

def save_job_result(
    job_id: str,
    status: str,
    overall_score: Optional[float],
    verdict: Optional[str],
    processing_time: Optional[float],
    executive_summary: Optional[str],
    slec_recommendation: Optional[str],
    pillar_results: List[Dict[str, Any]],
    conflicts: List[Dict[str, Any]],
    db_path: Optional[str] = None
):
    conn = get_connection(db_path)
    try:
        with conn:
            conn.execute(
                """
                UPDATE jobs
                SET status = ?, current_step = 'Evaluation Completed', overall_score = ?, verdict = ?, processing_time = ?,
                    executive_summary = ?, slec_recommendation = ?, updated_at = CURRENT_TIMESTAMP
                WHERE job_id = ?
                """,
                (status, overall_score, verdict, processing_time, executive_summary, slec_recommendation, job_id)
            )

            # Clear existing pillar records if any
            conn.execute("DELETE FROM pillar_evaluations WHERE job_id = ?", (job_id,))
            conn.execute("DELETE FROM findings WHERE job_id = ?", (job_id,))
            conn.execute("DELETE FROM conflicts WHERE job_id = ?", (job_id,))

            for pr in pillar_results:
                cursor = conn.execute(
                    """
                    INSERT INTO pillar_evaluations (job_id, pillar, score, weight, summary, guidelines_status, metrics_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        job_id,
                        pr.get("pillar", ""),
                        float(pr.get("score", 0.0)),
                        float(pr.get("weight", 0.25)),
                        pr.get("summary", ""),
                        pr.get("guidelines_status", "Unverified"),
                        json.dumps(pr.get("extracted_metrics", {}))
                    )
                )

                for f in pr.get("findings", []):
                    conn.execute(
                        """
                        INSERT INTO findings (job_id, pillar, category, description, dpr_page, guideline_reference, severity)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            job_id,
                            pr.get("pillar", ""),
                            f.get("category", "Finding"),
                            f.get("description", ""),
                            int(f.get("dpr_page", 1)),
                            f.get("guideline_reference"),
                            f.get("severity", "Medium")
                        )
                    )

            for c in conflicts:
                conn.execute(
                    """
                    INSERT INTO conflicts (job_id, title, pillars_involved, description, resolution, severity)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        job_id,
                        c.get("title", "Contradiction"),
                        json.dumps(c.get("pillars_involved", [])),
                        c.get("description", ""),
                        c.get("resolution", ""),
                        c.get("severity", "Medium")
                    )
                )
    finally:
        conn.close()

def get_job(job_id: str, db_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_connection(db_path)
    try:
        row = conn.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,)).fetchone()
        if not row:
            return None
        job_dict = dict(row)

        # Get pillar evaluations
        pillars = conn.execute("SELECT * FROM pillar_evaluations WHERE job_id = ?", (job_id,)).fetchall()
        job_dict["pillar_evaluations"] = []
        for p in pillars:
            p_dict = dict(p)
            try:
                p_dict["metrics"] = json.loads(p_dict.get("metrics_json") or "{}")
            except Exception:
                p_dict["metrics"] = {}
            job_dict["pillar_evaluations"].append(p_dict)

        # Get findings
        findings = conn.execute("SELECT * FROM findings WHERE job_id = ? ORDER BY dpr_page ASC", (job_id,)).fetchall()
        job_dict["findings"] = [dict(f) for f in findings]

        # Get conflicts
        conflicts = conn.execute("SELECT * FROM conflicts WHERE job_id = ?", (job_id,)).fetchall()
        job_dict["conflicts"] = []
        for c in conflicts:
            c_dict = dict(c)
            try:
                c_dict["pillars_involved"] = json.loads(c_dict.get("pillars_involved") or "[]")
            except Exception:
                c_dict["pillars_involved"] = []
            job_dict["conflicts"].append(c_dict)

        return job_dict
    finally:
        conn.close()

def list_jobs(limit: int = 50, db_path: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection(db_path)
    try:
        rows = conn.execute(
            """
            SELECT job_id, filename, status, overall_score, verdict, processing_time, created_at, updated_at
            FROM jobs
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def record_guideline_meta(pillar: str, filename: str, total_pages: int, total_chunks: int, db_path: Optional[str] = None):
    conn = get_connection(db_path)
    try:
        with conn:
            conn.execute(
                """
                INSERT INTO guideline_meta (pillar, filename, total_pages, total_chunks, ingested_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                """,
                (pillar, filename, total_pages, total_chunks)
            )
    finally:
        conn.close()

def get_guideline_stats(db_path: Optional[str] = None) -> Dict[str, Any]:
    conn = get_connection(db_path)
    try:
        rows = conn.execute(
            """
            SELECT pillar, COUNT(DISTINCT filename) as doc_count, SUM(total_pages) as pages, SUM(total_chunks) as chunks
            FROM guideline_meta
            GROUP BY pillar
            """
        ).fetchall()
        stats = {r["pillar"]: {"documents": r["doc_count"], "pages": r["pages"] or 0, "chunks": r["chunks"] or 0} for r in rows}
        return stats
    finally:
        conn.close()

def save_geospatial_data(job_id: str, geospatial_data: Dict[str, Any], db_path: Optional[str] = None):
    conn = get_connection(db_path)
    try:
        with conn:
            conn.execute(
                "UPDATE jobs SET geospatial_json = ?, updated_at = CURRENT_TIMESTAMP WHERE job_id = ?",
                (json.dumps(geospatial_data), job_id)
            )
    finally:
        conn.close()

def get_geospatial_data(job_id: str, db_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_connection(db_path)
    try:
        row = conn.execute("SELECT geospatial_json FROM jobs WHERE job_id = ?", (job_id,)).fetchone()
        if row and row["geospatial_json"]:
            return json.loads(row["geospatial_json"])
        return None
    finally:
        conn.close()
