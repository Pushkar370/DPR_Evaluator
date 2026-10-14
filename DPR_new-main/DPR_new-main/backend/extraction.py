import os
import io
import logging
from typing import Dict, Any, List

import fitz  # PyMuPDF
from PIL import Image

from backend.llm_client import llm_pool

logger = logging.getLogger(__name__)

def extract_document_flexible(pdf_path: str, job_id: str, output_dir: str = "uploads/images") -> Dict[str, Any]:
    """
    Extracts text as structured Markdown with page tracking (## Page X).
    Detects scanned PDFs and applies Gemini Vision OCR fallback when needed.
    Isolates embedded images for multimodal inspection.
    """
    logger.info(f"[EXTRACTION] Starting extraction for job {job_id} from {pdf_path}")
    
    job_image_dir = os.path.join(output_dir, job_id)
    os.makedirs(job_image_dir, exist_ok=True)
    
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        raise RuntimeError(f"Failed to open PDF document: {e}")

    total_pages = len(doc)
    markdown_parts = []
    extracted_images = []
    total_text_chars = 0
    scanned_pages_indices = []

    for page_num, page in enumerate(doc, start=1):
        page_text_blocks = []
        blocks = page.get_text("blocks")
        blocks.sort(key=lambda b: (b[1], b[0]))
        
        for b in blocks:
            # text block type is 0
            if b[6] == 0:
                text = b[4].strip()
                if not text:
                    continue
                total_text_chars += len(text)
                # Header heuristic based on brevity
                if len(text.split()) < 10 and not text.endswith(('.', ',', ';')):
                    page_text_blocks.append(f"### {text}\n")
                else:
                    page_text_blocks.append(f"{text}\n\n")

        page_text = "".join(page_text_blocks).strip()
        if len(page_text) < 50:
            scanned_pages_indices.append(page_num - 1)

        markdown_parts.append(f"\n## Page {page_num}\n{page_text}\n")
        
        # Handle Embedded Images
        try:
            image_list = page.get_images(full=True)
            for img_index, img in enumerate(image_list, start=1):
                xref = img[0]
                try:
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    image_ext = base_image["ext"]
                    image_filename = f"page_{page_num}_img_{img_index}.{image_ext}"
                    image_path = os.path.join(job_image_dir, image_filename)
                    
                    with open(image_path, "wb") as f:
                        f.write(image_bytes)
                    
                    extracted_images.append({
                        "page": page_num,
                        "path": image_path,
                        "ref": image_filename
                    })
                except Exception as img_err:
                    logger.debug(f"Failed to extract image xref {xref} on page {page_num}: {img_err}")
        except Exception:
            pass

    # Check if document is predominantly scanned / empty text
    avg_chars_per_page = total_text_chars / max(total_pages, 1)
    logger.info(f"[EXTRACTION] Extracted {total_text_chars} characters across {total_pages} pages (avg: {avg_chars_per_page:.1f} chars/page).")

    is_scanned = (total_text_chars < 150) or (len(scanned_pages_indices) == total_pages and avg_chars_per_page < 60)

    if is_scanned:
        logger.warning(f"[EXTRACTION] PDF {job_id} appears to be a scanned document. Attempting Gemini Vision OCR fallback...")
        if not llm_pool.gemini_keys:
            doc.close()
            raise ValueError(
                "Scanned PDF detected with no extractable text. To transcribe scanned documents, "
                "please configure GEMINI_API_KEY_1 in your .env for Gemini Vision OCR."
            )

        # Transcribe scanned pages using Gemini Vision
        ocr_markdown_parts = []
        for p_idx in range(total_pages):
            p_num = p_idx + 1
            page = doc[p_idx]
            logger.info(f"[VISION OCR] Transcribing page {p_num}/{total_pages} via Gemini Vision...")
            pix = page.get_pixmap(dpi=150)
            png_bytes = pix.tobytes("png")
            try:
                page_markdown = llm_pool.call_vision_transcribe(png_bytes, mime_type="image/png")
                ocr_markdown_parts.append(f"\n## Page {p_num}\n{page_markdown}\n")
            except Exception as ocr_err:
                logger.error(f"[VISION OCR] Failed page {p_num}: {ocr_err}")
                ocr_markdown_parts.append(f"\n## Page {p_num}\n[Page transcription failed: {ocr_err}]\n")

        final_markdown = "".join(ocr_markdown_parts)
    else:
        final_markdown = "".join(markdown_parts)

    doc.close()

    return {
        "text_markdown": final_markdown,
        "images": extracted_images,
        "job_id": job_id,
        "total_pages": total_pages,
        "is_scanned": is_scanned
    }
