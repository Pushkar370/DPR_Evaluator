"""
Migration and guideline seeding script for Qdrant.
Indexes documents and standard NE-SIDS seed rules into the local Qdrant collection.
"""

import sys
import logging
from backend.config import settings
from backend.guidelines_service import ingest_all_guidelines
from backend.rag_service import document_rag
from backend.database import init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    logger.info("Initializing database and Qdrant collections...")
    init_db()

    # 1. Ingest any PDFs present in the guidelines folder
    result = ingest_all_guidelines()
    logger.info(f"Guideline folder scan result: {result['message']}")

    # 2. If no PDFs were found, seed standard NE-SIDS reference rules
    if result.get("total_documents", 0) == 0:
        logger.info("No guideline PDFs found in guidelines/ directory. Seeding standard NE-SIDS compliance baseline...")
        seed_guidelines = [
            {
                "pillar": "technical",
                "page": 1,
                "source_doc": "NE-SIDS_Technical_Norms_2024.pdf",
                "text": "Technical Clause 1.1: All bridge and structural foundations in alluvial riverbeds must utilize minimum M25 grade reinforced cement concrete and comply with IRC:78 and IS 456. Substructure designs must account for maximum scour depth under 100-year flood events."
            },
            {
                "pillar": "technical",
                "page": 2,
                "source_doc": "NE-SIDS_Technical_Norms_2024.pdf",
                "text": "Technical Clause 2.4: Flexible pavement design for approach roads must follow IRC:37 standards considering cumulative traffic load in Million Standard Axles (MSA) and California Bearing Ratio (CBR) of subgrade soil."
            },
            {
                "pillar": "financial",
                "page": 1,
                "source_doc": "NE-SIDS_Financial_Guidelines_2024.pdf",
                "text": "Financial Clause 3.2: Bill of Quantities (BoQ) item rates must strictly conform to current CPWD or State PWD Schedule of Rates (SoR). Any non-scheduled items require market rate analysis approved by the Chief Engineer."
            },
            {
                "pillar": "financial",
                "page": 2,
                "source_doc": "NE-SIDS_Financial_Guidelines_2024.pdf",
                "text": "Financial Clause 4.1: Contingency provisions must not exceed 3% for physical contingencies and 5% for price escalation unless explicitly justified by geological risk studies. State share matching must be explicitly committed."
            },
            {
                "pillar": "administrative",
                "page": 1,
                "source_doc": "NE-SIDS_Admin_Governance_2024.pdf",
                "text": "Admin Clause 5.1: The DPR must confirm that 100% encumbrance-free land possession is achieved or clearly scheduled prior to tender award. An executing agency track record certificate is mandatory."
            },
            {
                "pillar": "social",
                "page": 1,
                "source_doc": "NE-SIDS_Social_Environmental_2024.pdf",
                "text": "Social Clause 6.1: Projects requiring diversion of forest land must have Stage-I Forest Clearance under the Forest (Conservation) Act and a dedicated budget for Compensatory Afforestation at 1:10 ratio."
            },
            {
                "pillar": "social",
                "page": 2,
                "source_doc": "NE-SIDS_Social_Environmental_2024.pdf",
                "text": "Social Clause 6.5: Environmental Management Plan (EMP) cost must be itemized separately. Stakeholder and Gram Sabha consultations must be documented with minutes of meetings."
            }
        ]

        document_rag.ingest_guidelines_batch(seed_guidelines)
        logger.info(f"Successfully seeded {len(seed_guidelines)} foundational NE-SIDS guideline rules into Qdrant.")

    logger.info("Qdrant guideline migration completed successfully.")

if __name__ == "__main__":
    main()
