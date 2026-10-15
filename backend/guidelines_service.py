import os
import logging
from pathlib import Path
from typing import Dict, Any, List

import fitz  # PyMuPDF

from backend.config import settings
from backend.rag_service import document_rag
from backend.database import record_guideline_meta, get_guideline_stats

logger = logging.getLogger(__name__)

VALID_PILLARS = ["technical", "administrative", "financial", "social"]

def ingest_all_guidelines(guidelines_dir: str = None) -> Dict[str, Any]:
    """
    Scans the guidelines folder (and subfolders technical/, administrative/, financial/, social/)
    and chunks/indexes all PDFs found.
    """
    base_dir = Path(guidelines_dir or settings.GUIDELINES_DIR)
    if not base_dir.exists():
        base_dir.mkdir(parents=True, exist_ok=True)
        for p in VALID_PILLARS:
            (base_dir / p).mkdir(parents=True, exist_ok=True)
        return {
            "status": "empty",
            "message": f"Created {base_dir}. Place guideline PDFs in pillar subfolders.",
            "total_documents": 0,
            "total_chunks": 0
        }

    total_docs = 0
    total_chunks = 0
    results_by_pillar = {p: 0 for p in VALID_PILLARS}

    # 1. Check pillar subdirectories
    for pillar in VALID_PILLARS:
        pillar_dir = base_dir / pillar
        if not pillar_dir.exists():
            pillar_dir.mkdir(parents=True, exist_ok=True)
            continue

        pdf_files = list(pillar_dir.glob("*.pdf"))
        for pdf_path in pdf_files:
            try:
                chunks_count = ingest_single_guideline_pdf(str(pdf_path), pillar)
                total_docs += 1
                total_chunks += chunks_count
                results_by_pillar[pillar] += chunks_count
                logger.info(f"[GUIDELINES] Ingested {pdf_path.name} under {pillar} ({chunks_count} chunks).")
            except Exception as e:
                logger.error(f"[GUIDELINES] Error processing {pdf_path}: {e}")

    # 2. Check root guidelines/ folder for any loose PDFs (tag as general/technical by default)
    root_pdfs = list(base_dir.glob("*.pdf"))
    for pdf_path in root_pdfs:
        try:
            chunks_count = ingest_single_guideline_pdf(str(pdf_path), "technical")
            total_docs += 1
            total_chunks += chunks_count
            results_by_pillar["technical"] += chunks_count
        except Exception as e:
            logger.error(f"[GUIDELINES] Error processing root guideline {pdf_path}: {e}")

    return {
        "status": "success" if total_docs > 0 else "empty",
        "total_documents": total_docs,
        "total_chunks": total_chunks,
        "chunks_by_pillar": results_by_pillar,
        "message": f"Successfully indexed {total_docs} guideline documents ({total_chunks} chunks)." if total_docs > 0 else "No guideline PDFs found. Guideline checks will be marked as unverified."
    }

def ingest_single_guideline_pdf(pdf_path: str, pillar: str) -> int:
    """Extracts, chunks, and indexes a single guideline PDF."""
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    all_chunks = []
    filename = Path(pdf_path).name

    for page_num, page in enumerate(doc, start=1):
        text = page.get_text("text").strip()
        if not text:
            continue

        # Split into ~1000 char chunks
        paragraphs = text.split("\n\n")
        current_chunk = ""
        for p in paragraphs:
            p = p.strip()
            if not p:
                continue
            if len(current_chunk) + len(p) > 1000:
                all_chunks.append({
                    "pillar": pillar,
                    "page": page_num,
                    "source_doc": filename,
                    "text": current_chunk.strip()
                })
                current_chunk = p + "\n"
            else:
                current_chunk += p + "\n"
        if current_chunk.strip():
            all_chunks.append({
                "pillar": pillar,
                "page": page_num,
                "source_doc": filename,
                "text": current_chunk.strip()
            })

    doc.close()

    if all_chunks:
        document_rag.ingest_guidelines_batch(all_chunks)
        record_guideline_meta(pillar, filename, total_pages, len(all_chunks))

    return len(all_chunks)
