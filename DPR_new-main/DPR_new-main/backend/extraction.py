import os
import logging
import fitz  # PyMuPDF
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

def extract_document_flexible(pdf_path: str, job_id: str, output_dir: str = "uploads/images") -> Dict[str, Any]:
    """
    Extracts text as structured Markdown and isolates images for Multimodal AI analysis.
    This replaces rigid template-based extraction.
    """
    logger.info(f"[EXTRACTION] Starting flexible extraction for {pdf_path}")
    
    # Ensure image directory exists
    job_image_dir = os.path.join(output_dir, job_id)
    os.makedirs(job_image_dir, exist_ok=True)
    
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        raise RuntimeError(f"Failed to open document: {e}")

    markdown_parts = []
    extracted_images = []
    
    for page_num, page in enumerate(doc, start=1):
        markdown_parts.append(f"\n## Page {page_num}\n")
        
        # Extract text blocks
        blocks = page.get_text("blocks")
        # Sort blocks top-to-bottom, left-to-right
        blocks.sort(key=lambda b: (b[1], b[0]))
        
        for b in blocks:
            # text block type is 0
            if b[6] == 0:
                text = b[4].strip()
                if not text:
                    continue
                # Simple heuristic for headers based on brevity
                if len(text.split()) < 10 and not text.endswith(('.', ',', ';')):
                    markdown_parts.append(f"### {text}\n")
                else:
                    markdown_parts.append(f"{text}\n\n")
                
        # Handle Images safely
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
                markdown_parts.append(f"\n![Image extracted: {image_filename}]({image_filename})\n")
            except Exception as e:
                logger.warning(f"Failed to extract image xref {xref} on page {page_num}: {e}")

    doc.close()
    
    final_markdown = "".join(markdown_parts)
    
    if not final_markdown.strip():
        raise ValueError("No text extracted. Document might be purely scanned images without OCR.")
        
    logger.info(f"[EXTRACTION] Completed. {len(extracted_images)} images extracted.")
    
    return {
        "text_markdown": final_markdown,
        "images": extracted_images,
        "job_id": job_id
    }
