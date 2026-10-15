# 🏛️ DPR Compliance Analysis & Multi-Agent Evaluation System

<div align="center">

![Government of India](https://img.shields.io/badge/Government%20of%20India-MDoNER-0f2c59)
![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)
![LangGraph](https://img.shields.io/badge/Multi--Agent-LangGraph-FF6F00)

**LangGraph Multi-Agent Detailed Project Report (DPR) Compliance Verification Platform**

*Built for the Ministry of Development of North Eastern Region (MDoNER) / NE-SIDS Scheme*

</div>

---

## 📌 Overview

The **DPR Compliance Analysis System** is an AI-powered document verification platform that evaluates complex infrastructure Detailed Project Reports (200+ pages) against **NE-SIDS (North East Special Infrastructure Development Scheme)** norms issued by MDoNER.

The system replaces rigid sequential prompts with a **LangGraph Multi-Agent Architecture** of 5 specialized agents that analyze the document in parallel, cross-reference findings, reconcile conflicts, and generate a weighted score and formal committee verdict.

---

## 🤖 Multi-Agent Architecture

```
                               ┌────────────────────────────────────────────────┐
                               │             DPR Upload (PDF)                  │
                               └──────────────────────┬─────────────────────────┘
                                                      │
                                                      ▼
                               ┌────────────────────────────────────────────────┐
                               │   Hybrid Ingestion & OCR Fallback Engine       │
                               │   - PyMuPDF text & page blocks extraction      │
                               │   - Scanned check -> Gemini Vision Fallback    │
                               │   - Sentence-Transformers (384-dim) Qdrant     │
                               └──────────────────────┬─────────────────────────┘
                                                      │
                                                      ▼
                               ┌────────────────────────────────────────────────┐
                               │           LANGGRAPH MULTI-AGENT SYSTEM         │
                               │                                                │
                               │   ┌────────────────────────────────────────┐   │
                               │   │          Manager Agent (Plan)          │   │
                               │   │       (Gemini 1.5 Flash - 1M Ctx)      │   │
                               │   │   - Reads DPR TOC & Executive Summary  │   │
                               │   │   - Assigns tailored focus per pillar  │   │
                               │   └──────────────────┬─────────────────────┘   │
                               │                      │                         │
                               │       ┌──────────────┴──────────────┐          │
                               │       ▼                             ▼          │
                               │ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐│
                               │ │ Technical │ │ Financial │ │   Admin   │ │  Social   ││
                               │ │ (Groq 70B)│ │ (Groq 70B)│ │ (Groq 70B)│ │ (Groq 70B)││
                               │ │  Weight   │ │  Weight   │ │  Weight   │ │  Weight   ││
                               │ │    30%    │ │    30%    │ │    20%    │ │    20%    ││
                               │ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘│
                               │       └──────────────┬──────────────┘          │
                               │                      ▼                         │
                               │   ┌────────────────────────────────────────┐   │
                               │   │        Manager Agent (Reconcile)       │   │
                               │   │   - Resolves cross-pillar conflicts    │   │
                               │   │   - Computes weighted score (0-100)    │   │
                               │   │   - Verdict: Approve / Revise / Reject │   │
                               │   └──────────────────┬─────────────────────┘   │
                               └──────────────────────┼─────────────────────────┘
                                                      │
                                                      ▼
                               ┌────────────────────────────────────────────────┐
                               │         SQLite Persistent Store & APIs         │
                               │         (Jobs, Pillars, Findings, Conflicts)  │
                               └──────────────────────┬─────────────────────────┘
                                                      │
                                                      ▼
                               ┌────────────────────────────────────────────────┐
                               │      React Frontend (Scorecards, Citations,   │
                               │      Conflict Cards, Backend-loaded History)   │
                               └────────────────────────────────────────────────┘
```

### The 5 Agents

| Agent | Model | Weight | Focus Areas |
|---|---|---|---|
| **Technical Agent** | Groq Llama-3.3-70B | **30%** | Structural designs, engineering specifications, IS/IRC standards, BoQ civil works breakdown, soil/geotech surveys, safety codes. |
| **Financial Agent** | Groq Llama-3.3-70B | **30%** | Schedule of Rates (SoR) validation, cost realism, cost-benefit ratio / IRR / NPV, contingency allowances, funding schedules. |
| **Administrative Agent** | Groq Llama-3.3-70B | **20%** | Statutory clearances, land possession readiness, executing agency capacity, milestone timeline feasibility. |
| **Social & Environmental Agent** | Groq Llama-3.3-70B | **20%** | Environmental Impact Assessment (EIA), forest & wildlife clearances, EMP budget, Social Impact Assessment (SIA), community consultations. |
| **Manager Agent** | Gemini 1.5 Flash | **Coordinator** | Directs pillar focus, reconciles cross-pillar contradictions, computes weighted composite score (0-100), and issues official verdict. |

---

## 📊 Scoring Rubric & Decision Rules

Composite score formula:
$$\text{Score} = (0.30 \times \text{Technical}) + (0.30 \times \text{Financial}) + (0.20 \times \text{Administrative}) + (0.20 \times \text{Social})$$

| Verdict | Criteria | Action |
|---|---|---|
| **Approve** | Composite score $\ge 75/100$, no pillar $< 60/100$, and zero unresolved critical blockers. | Fast-tracked for SLEC sanction. |
| **Revise** | Composite score $50 - 74/100$, or any pillar between $40 - 59/100$, or resolvable contradictions. | Sent back to implementing department with specific rectifications cited with page numbers. |
| **Reject** | Composite score $< 50/100$, or any pillar $< 40/100$, or statutory violation. | Rejected with formal SLEC findings. |

---

## 📚 Guideline Ingestion Pipeline

Guideline documents are stored in the `guidelines/` directory organized by pillar:

```
guidelines/
├── technical/       # Engineering, IS codes, IRC norms
├── financial/       # Cost norms, Schedule of Rates (SoR), Contingency rules
├── administrative/  # Approvals, SLEC norms, agency eligibility
└── social/          # ESIA, Forest/Wildlife clearances, Land Acquisition
```

- When PDFs are dropped into these folders, they are chunked, tagged with page numbers, and indexed into the Qdrant `dpr_guidelines` collection using `all-MiniLM-L6-v2`.
- If no guideline PDFs are present, the system operates in an explicit **"Unverified"** mode, citing document excerpts without hallucinating nonexistent guidelines.
- Ingestion can be triggered anytime via `POST /guidelines/ingest`.

---

## 🔑 LLM Key Pool & Resilience Strategy

The system supports a rotating pool of API keys configured in `.env`:

```env
# Gemini Pool (Up to 3 keys)
GEMINI_API_KEY_1=...
GEMINI_API_KEY_2=...
GEMINI_API_KEY_3=...

# Groq Pool (Up to 2 keys)
GROQ_API_KEY_1=...
GROQ_API_KEY_2=...

# Models
GEMINI_MODEL_NAME=gemini-1.5-flash
GROQ_MODEL_NAME=llama-3.3-70b-versatile
```

- **Rotation**: Automatically round-robins across available keys.
- **Cross-Provider Fallback**: If Groq encounters rate limits (HTTP 429 / Quota), it seamlessly falls back to the Gemini Flash pool. If Gemini encounters rate limits, it falls back to Groq.
- **Pydantic Validation**: Every LLM response is strictly parsed and validated against Pydantic schemas, with automated JSON syntax repair on malformed outputs.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (async REST API)
- **Multi-Agent Orchestration**: LangGraph
- **LLM Providers**: Groq (Llama-3.3-70B) & Google Gemini (1.5 Flash)
- **Vector Database**: Qdrant (local persistent path)
- **Embeddings**: `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional dense vectors)
- **PDF Extraction**: PyMuPDF (`fitz`) + Gemini Vision OCR fallback
- **Storage**: SQLite (`dpr_evaluation.db`) with WAL mode

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **UI Components**: Material-UI (MUI v5)
- **Icons**: MUI Icons
- **HTTP Client**: Axios with typed service layer

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
# Navigate to project directory
cd DPR_new-main/DPR_new-main

# Create virtual environment with uv
uv venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/macOS

# Install dependencies
uv pip install -r backend/requirements.txt

# Configure your API keys in .env
copy .env.example .env
# Edit .env and insert your GEMINI_API_KEY_1..3 and GROQ_API_KEY_1..2

# Initialize Qdrant vector store and seed baseline rules
.venv\Scripts\python.exe -m backend.scripts.migrate_to_qdrant

# Start the FastAPI server
.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd Frontend-DPR

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to access the dashboard.

---

## 🧪 Testing

Run unit tests and end-to-end integration tests:

```bash
# Run agent tests
.venv\Scripts\python.exe -m pytest backend/tests/test_agents.py -v

# Run golden path end-to-end test
.venv\Scripts\python.exe -m pytest backend/tests/test_golden_path.py -v
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health, version, and guideline status |
| `POST` | `/upload` | Upload DPR PDF (returns `job_id`) |
| `GET` | `/status/{job_id}` | Poll job processing status |
| `GET` | `/report/{job_id}` | Retrieve complete multi-agent evaluation report |
| `GET` | `/reports` | Retrieve list of all past evaluations from SQLite |
| `GET` | `/report/{job_id}/pillars` | Get detailed pillar scorecards and findings |
| `GET` | `/report/{job_id}/conflicts` | Get cross-pillar conflicts reconciled by Manager |
| `GET` | `/guidelines/status` | Ingested guideline chunks count per pillar |
| `POST` | `/guidelines/ingest` | Trigger re-indexing of `guidelines/` directory |
| `POST` | `/chat` | RAG-powered chatbot answering questions on the DPR |
