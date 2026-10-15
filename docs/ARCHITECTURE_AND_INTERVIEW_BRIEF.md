# DPR Compliance Analysis System: Architecture, Flow, and Technical Defense Brief

## 1. System Purpose

This platform implements an AI-assisted Detailed Project Report (DPR) evaluation system for Indian government infrastructure workflows (specifically targeting MDoNER / NE-SIDS projects). The system replaces manual, error-prone committee reviews with an automated, multi-agent evaluation pipeline that combines:

- High-fidelity PDF document extraction with image preservation
- Gemini Vision OCR fallback for scanned, image-only documents
- Semantic retrieval with local Sentence-Transformers embeddings (`all-MiniLM-L6-v2`) and local Qdrant vector indexing
- A 5-Agent LangGraph multi-agent orchestration graph (4 parallel Pillar Agents + 1 Manager Agent)
- Cross-pillar conflict reconciliation and weighted composite scoring
- Durable SQLite persistence in WAL mode with complete audit trail
- A modern Material-UI React + Vite frontend dashboard

---

## 2. High-Level Architecture

```mermaid
flowchart LR
    U[User in Browser] --> F[React Frontend\nFrontend-DPR/]
    F -->|POST /upload| A[FastAPI Backend\nbackend/main.py]
    F -->|GET /status/{job_id}| A
    F -->|GET /report/{job_id}| A
    F -->|GET /reports| A
    F -->|POST /chat| A

    A --> S[services.py\nJob orchestration]
    S --> X[extraction.py\nPyMuPDF + Vision OCR]
    S --> R[rag_service.py\nSentence-Transformers + Qdrant]
    S --> LG[multi_agent/graph.py\nLangGraph StateGraph]

    R --> Q[(Local Qdrant store\nlocal_qdrant_data/)]
    X --> I[(uploads/)]
    LG --> DB[(SQLite: dpr_evaluation.db)]
    LG --> LLM[(LLM Pool: Gemini + Groq)]
```

---

## 3. Backend Architecture

### 3.1 Entry Point and API Layer (`backend/main.py`)
- Exposes RESTful endpoints: `/upload`, `/status/{job_id}`, `/report/{job_id}`, `/reports`, `/report/{job_id}/pillars`, `/report/{job_id}/conflicts`, `/guidelines/status`, `/guidelines/ingest`, `/chat`.
- Validates file uploads: checks case-insensitive `.pdf` extension, 0-byte detection, and a 100MB maximum file size limit.
- Enables CORS for local frontend ports (`http://localhost:3000`, `http://localhost:5173`).
- Handles background execution via FastAPI's native `BackgroundTasks`.

### 3.2 Orchestration Layer (`backend/services.py`)
- Coordinates the lifecycle of a job from creation to completion.
- Records initial job metadata in SQLite.
- Invokes flexible document extraction (`backend/extraction.py`).
- Indexes document chunks into Qdrant (`backend/rag_service.py`).
- Executes the compiled LangGraph workflow (`dpr_agent_app.invoke(initial_state)`).
- Saves full evaluation results, pillar scorecards, page-cited findings, and reconciled conflicts to SQLite.

### 3.3 Extraction & Vision OCR Layer (`backend/extraction.py`)
- Uses PyMuPDF to extract text blocks while tracking page numbers (`## Page X`).
- Computes character density per page.
- If zero or negligible text is detected (scanned document), automatically triggers Gemini Vision OCR fallback, converting pages to PNG images and extracting text while preserving page numbering.

### 3.4 Vector & Semantic Retrieval Layer (`backend/rag_service.py`)
- Embeddings: Local `all-MiniLM-L6-v2` (384-dimensional dense vectors) executed locally on CPU/GPU without external API dependency.
- Vector DB: Local Qdrant stored on disk at `local_qdrant_data/`.
- Two distinct collections:
  - `dpr_documents`: Chunked DPR text filtered by `job_id`.
  - `dpr_guidelines`: MDoNER / NE-SIDS guideline clauses partitioned by pillar tag (`technical`, `financial`, `administrative`, `social`).
- Ingestion pipeline (`backend/guidelines_service.py` & `migrate_to_qdrant.py`) seeds baseline clauses into Qdrant.

### 3.5 LangGraph Multi-Agent Architecture (`backend/multi_agent/`)
Replaces sequential prompt loops with an explicit StateGraph:
1. **Plan Node (`manager_agent.py`)**: Manager reviews the document TOC and executive summary, issuing specialized directives for each pillar.
2. **Parallel Pillar Nodes (`pillar_agents.py`)**:
   - **Technical Agent (30% weight)**: Scope, engineering feasibility, drawings, bill of quantities (BOQ), soil suitability.
   - **Financial Agent (30% weight)**: Cost estimates, SOR rate adherence, contingency caps (max 3% physical / 8% total), non-duplication certificates.
   - **Administrative Agent (20% weight)**: Land possession (100% encumbrance-free), statutory clearances, executing agency track record.
   - **Social & Environmental Agent (20% weight)**: Forest/environmental clearances, stakeholder consultations, tribal welfare, gender inclusion.
   Each pillar queries up to 15 relevant DPR chunks + guideline clauses and produces structured `PillarScorecard` objects with page citations (`dpr_page`).
3. **Reconciliation Node (`manager_agent.py`)**: Manager compares all pillar scorecards, identifies cross-pillar contradictions (e.g., timeline vs. tender schedule, contingency costs vs. engineering scope), generates resolutions, computes weighted composite score, and issues a formal committee verdict (**Approve**, **Revise**, or **Reject**).
4. **Persistence Node (`graph.py`)**: Persists complete state to SQLite (`dpr_evaluation.db`).

### 3.6 LLM Resilience & Key Pool Manager (`backend/llm_client.py`)
- Round-robin key rotation across up to 3 Gemini keys and 2 Groq keys.
- Automatic key sanitization: redacts all API keys from logs and error strings using regex masking (`...[REDACTED]`).
- Auto-dropping of invalid keys (`400/401`).
- Exponential backoff (2s, 4s) on rate limits (`429`).
- Cross-provider fallback: seamlessly falls back between providers if quotas are exhausted.

### 3.7 Database Persistence (`backend/database.py`)
- SQLite database configured in WAL (Write-Ahead Logging) mode with `foreign_keys=ON`.
- Normalized schema: `jobs`, `pillar_evaluations`, `findings`, `conflicts`, `guideline_meta`.
- Reports persist across server restarts and are queryable via `GET /reports`.

---

## 4. Frontend Architecture (`Frontend-DPR`)

- **Tech Stack**: React 18, TypeScript 5, Vite, Material-UI (MUI).
- **Key Views**:
  - `Dashboard`: Real-time statistics, monthly trends, and risk distribution charts.
  - `UploadDocuments`: Drag-and-drop DPR upload with file validation chips and direct analysis trigger.
  - `AnalysisDashboard`: Live evaluation viewer showing 4 Pillar Scorecards, progress bars, page-cited findings, and Manager conflict resolution cards.
  - `Reports`: Historical audit archive querying SQLite backend directly.
  - `GeospatialVerification`: Leaflet interactive map with project coordinates verification.
- **API Client (`src/services/api.ts`)**: Strongly typed Axios client pointing to `http://localhost:8000`.

---

## 5. Technical Defense & Interview Questions

### Q: Why LangGraph instead of a sequential chain or AutoGen?
**A:** Sequential chains cannot model cross-pillar contradiction resolution; a later prompt forgets or overrides early steps. AutoGen's conversational turn-taking is non-deterministic and can loop infinitely. LangGraph provides a deterministic DAG with fan-out (parallel pillar evaluation) and fan-in (manager reconciliation), with strict Pydantic state validation and checkpointing.

### Q: How do you prevent hallucinations in page citations?
**A:** During PyMuPDF extraction, each page's text is tagged with `## Page X`. The RAG pipeline attaches `page` metadata to every vector chunk. When a pillar agent receives retrieved context, the system prompt explicitly instructs it to cite the exact `DPR Page X` from the chunk header.

### Q: How are rate limits and key exhaustion handled in production?
**A:** The `LLMKeyPoolManager` maintains key queues. On HTTP 429 or quota exhaustion, it applies exponential backoff and rotates to the next available key slot in the pool. Invalid keys (HTTP 400/401) are permanently evicted from the active pool.
