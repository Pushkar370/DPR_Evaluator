# DPR Quality & Compliance Assessment System
## Complete Clean-Machine Run Guide (Windows, macOS & Linux)

This guide provides step-by-step instructions to set up, configure, and run the **DPR Quality & Compliance Assessment System** on a clean machine.

---

### Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Clone the Repository](#2-clone-the-repository)
3. [Backend Setup (Virtual Environment & Dependencies)](#3-backend-setup)
4. [Environment Configuration (.env & API Keys)](#4-environment-configuration)
5. [MDoNER / NE-SIDS Guidelines Ingestion](#5-guidelines-ingestion)
6. [Start the Backend Server](#6-start-the-backend-server)
7. [Frontend Setup & Dev Server](#7-frontend-setup)
8. [Running Your First Evaluation](#8-running-your-first-evaluation)
9. [Running the Test Suite](#9-running-the-test-suite)
10. [Troubleshooting Guide](#10-troubleshooting-guide)

---

### 1. Prerequisites

Ensure the following tools are installed on your machine:

| Tool | Recommended Version | Verification Command |
| :--- | :--- | :--- |
| **Python** | `3.10`, `3.11`, or `3.12` | `python --version` (or `python3 --version`) |
| **Node.js** | `18.x`, `20.x`, or `22.x` | `node --version` |
| **npm** | `9.x` or `10.x` | `npm --version` |
| **Git** | `2.30+` | `git --version` |
| **uv** *(Optional, faster)* | Latest | `uv --version` |

---

### 2. Clone the Repository

```bash
git clone https://github.com/Pushkar370/DPR_PBL.git
cd DPR_PBL
```

> **Repository Directory Structure Note:**
> The active application codebase lives inside `DPR_new-main/DPR_new-main/`:
> - Backend: `DPR_new-main/DPR_new-main/backend/`
> - Frontend: `DPR_new-main/DPR_new-main/Frontend-DPR/`

---

### 3. Backend Setup

#### On Windows (PowerShell)
```powershell
# Navigate to the backend directory
cd DPR_new-main\DPR_new-main

# Create virtual environment
python -m venv .venv

# If using uv (10x faster):
# uv venv .venv

# Activate virtual environment
.venv\Scripts\Activate.ps1
# (If execution policy error occurs, run: Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned)

# Install pinned backend dependencies
pip install -r backend/requirements.txt
# (Or with uv): uv pip install -r backend/requirements.txt
```

#### On macOS / Linux (Bash/Zsh)
```bash
# Navigate to the backend directory
cd DPR_new-main/DPR_new-main

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install pinned backend dependencies
pip install -r backend/requirements.txt
```

---

### 4. Environment Configuration

Copy `.env.example` to create `.env` in `DPR_new-main/DPR_new-main/`:

#### Windows PowerShell:
```powershell
Copy-Item .env.example .env
```

#### macOS / Linux:
```bash
cp .env.example .env
```

Open `.env` and enter your API keys. The system uses an intelligent multi-key rotation pool:

```ini
# =====================================================================
# DPR Quality Assessment System - Environment Keys
# =====================================================================

# 1. Google Gemini Keys (Up to 3 keys for auto-rotation & fallback)
GEMINI_API_KEY_1=AIzaSy...your_first_gemini_key
GEMINI_API_KEY_2=AIzaSy...your_second_gemini_key
GEMINI_API_KEY_3=AIzaSy...your_third_gemini_key
GEMINI_MODEL_NAME=gemini-3.5-flash-lite

# 2. Groq Cloud Keys (Up to 2 keys; must start with gsk_)
GROQ_API_KEY_1=gsk_...your_groq_key_1
GROQ_API_KEY_2=gsk_...your_groq_key_2
GROQ_MODEL_NAME=llama-3.3-70b-versatile

# 3. Persistent SQLite & Local Vector Store
SQLITE_DB_PATH=dpr_evaluation.db
LOCAL_EMBEDDING_MODEL=all-MiniLM-L6-v2
QDRANT_LOCAL_PATH=local_qdrant_data
QDRANT_COLLECTION_NAME=dpr_documents
GUIDELINES_COLLECTION_NAME=dpr_guidelines

# 4. Storage Directories
GUIDELINES_DIR=guidelines
UPLOADS_DIR=uploads

# 5. Multi-Agent Pillar Weights
WEIGHT_TECHNICAL=0.30
WEIGHT_FINANCIAL=0.30
WEIGHT_ADMINISTRATIVE=0.20
WEIGHT_SOCIAL=0.20
```

> [!NOTE]
> - At least **one valid Gemini key** (`GEMINI_API_KEY_1`) is required.
> - The key pool automatically skips rate-limited (`429`) or invalid (`400/401`) keys without crashing your workflow.
> - API keys are strictly redacted from logs (`...ABCD`).

---

### 5. Guidelines Ingestion

The DPR system evaluates documents against official **MDoNER / NE-SIDS** guidelines stored in `guidelines/` by pillar:
- `guidelines/technical/`
- `guidelines/financial/`
- `guidelines/administrative/`
- `guidelines/social/`

#### Command to Ingest Guidelines:
Run from `DPR_new-main/DPR_new-main` with your virtual environment active:

```powershell
# Windows PowerShell
.venv\Scripts\python.exe backend/scripts/migrate_to_qdrant.py
```

```bash
# macOS / Linux
python backend/scripts/migrate_to_qdrant.py
```

*Expected output:*
```
[QDRANT] Seeding baseline guidelines for NE-SIDS pillars...
[QDRANT] Successfully initialized and seeded guidelines!
```

---

### 6. Start the Backend Server

Working Directory: `DPR_new-main/DPR_new-main`

#### Windows PowerShell:
```powershell
.venv\Scripts\Activate.ps1
uvicorn backend.main:app --port 8000 --reload
```

#### macOS / Linux:
```bash
source .venv/bin/activate
uvicorn backend.main:app --port 8000 --reload
```

#### Verification URLs:
- **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)
  *Returns:* `{"status": "healthy", "service": "DPR Compliance Analysis API", "version": "2.0.0", "multi_agent_framework": "LangGraph", "guidelines_loaded": true}`
- **Interactive OpenAPI Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 7. Frontend Setup & Dev Server

Open a **second terminal**.

```bash
# From repository root
cd DPR_new-main/DPR_new-main/Frontend-DPR

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

*Expected output:*
```
  VITE v7.3.1  ready in 624 ms

  ➜  Local:   http://localhost:3000/
```

Open your browser to: **[http://localhost:3000](http://localhost:3000)**

---

### 8. Running Your First Evaluation

#### Via the Web Dashboard:
1. Open [http://localhost:3000](http://localhost:3000) (Demo credentials: `admin` / `admin`).
2. Click **Upload Documents** in the sidebar.
3. Drag & drop `real_DPR.pdf` (sample located in `Frontend-DPR/public/real_DPR.pdf` or root).
4. Click **Start 5-Agent Evaluation**.
5. The application will track the evaluation progress through the LangGraph agents:
   - **Manager Agent** (Plan & Task Decomposition)
   - **4 Parallel Pillar Agents** (Technical, Financial, Administrative, Social)
   - **Manager Reconciliation** (Cross-Pillar Conflict Resolution & Weighted Scoring)
6. Within 12–25 seconds, the full audit report renders with:
   - Composite Weighted Score (`73.0 / 100`) and Verdict (`Revise`)
   - 4 Pillar Scorecards with progress bars and weights
   - Granular findings citing exact `DPR Page X` and NE-SIDS clauses
   - Cross-pillar conflict resolution card

#### Via Automated CLI Script:
From `DPR_new-main/DPR_new-main`:
```powershell
.venv\Scripts\python.exe backend/scripts/run_audit_e2e.py
```

---

### 9. Running the Test Suite

#### Backend Tests (Unit & LangGraph Golden Path Flow):
From `DPR_new-main/DPR_new-main`:
```powershell
.venv\Scripts\python.exe -m pytest backend/tests -v
```
*Expected Result:*
```
backend/tests/test_agents.py::test_manager_plan PASSED                   [ 14%]
backend/tests/test_agents.py::test_technical_agent PASSED                [ 28%]
backend/tests/test_agents.py::test_financial_agent PASSED                [ 42%]
backend/tests/test_agents.py::test_administrative_agent PASSED           [ 57%]
backend/tests/test_agents.py::test_social_agent PASSED                   [ 71%]
backend/tests/test_agents.py::test_manager_reconciliation PASSED         [ 85%]
backend/tests/test_golden_path.py::test_golden_path_flow PASSED          [100%]
============================== 7 passed ==============================
```

#### Frontend Type Checking & Production Build:
From `DPR_new-main/DPR_new-main/Frontend-DPR`:
```bash
# Type check without emitting files
npx tsc --noEmit

# Production bundle build
npm run build
```

---

### 10. Troubleshooting Guide

| Issue / Error | Root Cause | Solution |
| :--- | :--- | :--- |
| **`400 API_KEY_INVALID`** | Expired or mistyped Gemini API key. | The system auto-drops invalid keys and rotates to the next key. Verify your keys in [Google AI Studio](https://aistudio.google.com/) and update `.env`. |
| **`429 Resource Exhausted / Rate Limit`** | API quota exceeded on active key slot. | `LLMKeyPoolManager` will automatically execute exponential backoff (2s, 4s) and switch to the next key in your pool. Add a second key (`GEMINI_API_KEY_2`) in `.env`. |
| **`Port 8000 already in use`** | A dangling `uvicorn` process is running. | **Windows:** Run `netstat -ano \| findstr :8000`, then `taskkill /F /PID <PID>`.<br>**Linux/Mac:** Run `lsof -ti :8000 \| xargs kill -9`. |
| **`Port 3000 already in use`** | Another Vite process is running. | Change the port in `vite.config.ts` or kill the process on port 3000. |
| **`CORS Error in Browser Console`** | Frontend running on non-whitelisted port. | Check `ALLOWED_ORIGINS` in [backend/config.py](file:///c:/Users/ASUS/OneDrive/Desktop/DPR_PBL/DPR_new-main/DPR_new-main/backend/config.py). `http://localhost:3000` and `http://localhost:5173` are enabled by default. |
| **`Guidelines Loaded: False`** | Qdrant vector collection is empty. | Run `.venv\Scripts\python.exe backend/scripts/migrate_to_qdrant.py` or trigger `POST /guidelines/ingest` via API docs. |
| **`Scanned PDF / Zero Text Extracted`** | PDF contains image-only scanned pages. | The pipeline detects zero text and automatically invokes Gemini Vision OCR (`extract_document_flexible`), processing pages image-by-image with page-number tracking. |
| **`PowerShell Scripts Disabled`** | Windows execution policy blocks `.venv\Scripts\Activate.ps1`. | Run PowerShell as Administrator and execute: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`. |
