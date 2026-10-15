# DPR Compliance Analysis System - Architecture and Working Guide

This document explains the architecture, the LangGraph multi-agent orchestration pipeline, and how each component evaluates Detailed Project Reports (DPRs) against NE-SIDS / MDoNER standards.

---

## 1. Objective

The system automates the evaluation of Detailed Project Reports (often 200+ pages) for infrastructure projects funded under the **NE-SIDS (North East Special Infrastructure Development Scheme)** by MDoNER.

Primary capabilities:
- **PyMuPDF text extraction + Gemini Vision OCR fallback** for scanned pages
- **Semantic retrieval** with local Sentence-Transformers embeddings (`all-MiniLM-L6-v2`, 384-dim) and local Qdrant collections
- **LangGraph Multi-Agent Architecture**: 4 specialized pillar agents (Technical, Financial, Administrative, Social) running in parallel, orchestrated by 1 Manager Agent
- **Conflict Resolution & Weighted Scoring**: Manager reconciles cross-pillar discrepancies and calculates a formal composite score and verdict (Approve / Revise / Reject)
- **Persistent Storage**: SQLite database (`dpr_evaluation.db`) for job history, pillar evaluations, page-cited findings, and conflict logs
- **Modern React Dashboard**: Material-UI frontend with independent pillar scorecards, page citations, conflict resolution cards, and backend history

---

## 2. High-Level Architecture

```mermaid
graph TD
    subgraph FE ["Frontend (React + TypeScript + Vite + MUI)"]
        A1["Upload DPR PDF / Scanned Doc"]
        A2["Status Polling & Real-time Progress"]
        A3["4-Pillar Scorecards & Conflict Cards"]
        A4["History Archive View"]
        A5["RAG Chatbot Assistant"]
    end

    subgraph BE ["Backend (FastAPI)"]
        B1["POST /upload"]
        B2["PDF & Vision OCR Pipeline"]
        B3["RAG Vector Ingestion"]
        B4["LangGraph Multi-Agent Engine"]
        B5["GET /status/:job_id"]
        B6["GET /report/:job_id"]
        B7["GET /reports - SQLite History"]
        B8["POST /chat - RAG Assistant"]
    end

    subgraph STORE ["Data & Vector Stores"]
        C1[("uploads/ PDF & Image artifacts")]
        C2[("Qdrant: dpr_documents & dpr_guidelines")]
        C3[("SQLite: dpr_evaluation.db")]
    end

    subgraph LLM_POOL ["LLM Key Pool Manager"]
        D1["Gemini Key Pool - Manager & Vision OCR"]
        D2["Groq / Gemini Secondary - Pillar Agents"]
        D3["Round-Robin Rotation, Backoff & Error Sanitization"]
    end

    A1 --> B1
    B1 --> C1
    B1 --> B2
    B2 --> B3
    B3 --> C2
    B2 --> B4
    B4 --> LLM_POOL
    B4 --> C3
    A2 --> B5
    B5 --> C3
    A3 --> B6
    B6 --> C3
    A4 --> B7
    B7 --> C3
    A5 --> B8
    B8 --> C2
    B8 --> LLM_POOL
```

---

## 3. The LangGraph Multi-Agent Workflow

```mermaid
sequenceDiagram
    participant User as Assessor (Browser)
    participant API as FastAPI Backend
    participant Ingest as Extraction & Qdrant
    participant Manager as Manager Agent (Gemini Flash)
    participant Pillars as 4 Pillar Agents (Groq 70B / Gemini)
    participant DB as SQLite (dpr_evaluation.db)

    User->>API: POST /upload (PDF file)
    API-->>User: job_id
    API->>Ingest: Extract text blocks + images (OCR fallback if scanned)
    Ingest->>Ingest: Vectorize chunks into Qdrant (384-dim)
    API->>Manager: Step 1: Analyze TOC/Summary & Plan Directives
    Manager-->>Pillars: Step 2: Fan-out tailored queries
    par Technical Agent (30%)
        Pillars->>Pillars: Query 15 DPR chunks + Guidelines => Score & Citations
    and Financial Agent (30%)
        Pillars->>Pillars: Query 15 DPR chunks + Guidelines => Score & Citations
    and Administrative Agent (20%)
        Pillars->>Pillars: Query 15 DPR chunks + Guidelines => Score & Citations
    and Social & Environmental (20%)
        Pillars->>Pillars: Query 15 DPR chunks + Guidelines => Score & Citations
    end
    Pillars->>Manager: Step 3: Fan-in pillar evaluations
    Manager->>Manager: Cross-reference & resolve contradictions
    Manager->>Manager: Compute weighted score & issue verdict (Approve/Revise/Reject)
    Manager->>DB: Step 4: Persist job, scorecards, findings & conflicts
    loop Poll status
        User->>API: GET /status/:job_id
        API-->>User: PROCESSING -> COMPLETED
    end
    User->>API: GET /report/:job_id
    API-->>User: Full AnalysisReport (Scorecards, Citations, Verdict)
```

---

## 4. Scoring Rubric & Decision Rules

Composite score formula:
$$\text{Score} = (0.30 \times \text{Technical}) + (0.30 \times \text{Financial}) + (0.20 \times \text{Administrative}) + (0.20 \times \text{Social})$$

- **Approve**: Composite score $\ge 75/100$, no single pillar $< 60/100$, and no critical unresolvable blockers.
- **Revise**: Composite score $50 - 74/100$, or any pillar between $40 - 59/100$, or fixable contradictions (returned to department with page citations).
- **Reject**: Composite score $< 50/100$, or any pillar $< 40/100$, or statutory non-compliance.

---

## 5. Storage Model

- **Database**: `dpr_evaluation.db` (SQLite in WAL mode)
  - `jobs`: Overall job status, composite score, verdict, timing, executive summary
  - `pillar_evaluations`: Per-pillar scores, weights, narrative summaries, guideline status, metrics
  - `findings`: Granular items with mandatory `dpr_page` citations, severity, and guideline references
  - `conflicts`: Cross-pillar contradictions reconciled by the Manager
  - `guideline_meta`: Metadata for ingested guideline documents
- **Vector DB**: `local_qdrant_data/`
  - `dpr_documents`: 384-dim dense vectors tagged with `job_id` and `page`
  - `dpr_guidelines`: 384-dim dense vectors tagged with `pillar`, `page`, and `source_doc`
