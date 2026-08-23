# 🏛️ DPR Compliance Analysis System

<div align="center">

![Government of India](https://img.shields.io/badge/Government%20of%20India-MDoNER-0f2c59)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)
![CUDA](https://img.shields.io/badge/CUDA-11.8-76B900?logo=nvidia&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)

**AI-Powered Development Plan Report (DPR) Compliance Verification System**

*Built for Ministry of Development of North Eastern Region (MDoNER)*

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API Reference](#-api-reference) • [Documentation](#-documentation)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage Guide](#-usage-guide)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

The **DPR Compliance Analysis System** is an intelligent document verification platform that automates the assessment of Development Plan Reports against **NE-SIDS (North East Special Infrastructure Development Scheme)** guidelines issued by MDoNER.

### The Problem

Manual DPR review is:
- ⏱️ **Time-consuming** — Days to weeks per document
- ❌ **Error-prone** — Human reviewers miss details
- 📊 **Inconsistent** — Different reviewers, different standards
- 💰 **Resource-intensive** — Requires domain experts

### Our Solution

An AI-powered system that:
- 📄 **Extracts text** from scanned/digital PDFs using hybrid OCR
- 🔍 **Retrieves** relevant compliance guidelines using vector search
- 🧠 **Analyzes** document sections against NE-SIDS requirements
- 📈 **Scores** compliance across 5 key dimensions
- ⚡ **Processes** documents in seconds using GPU acceleration

---

## ✨ Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| 📄 **Smart PDF Upload** | Drag-and-drop interface supporting PDF up to 50MB |
| 🔍 **Hybrid OCR** | PaddleOCR + PyMuPDF for both scanned and digital PDFs |
| 🧠 **RAG Analysis** | FAISS vector search with 51 pre-indexed guideline chunks |
| 📊 **Multi-Section Scoring** | Technical, Environmental, Administrative, Financial, Social |
| ⚡ **GPU Acceleration** | CUDA 11.8 powered embeddings on RTX 4050 |
| 🔄 **Real-time Updates** | 2-second polling with live progress indicators |
| 🎨 **Government UI** | MDoNER-branded interface with responsive design |
| 🛡️ **Error Boundaries** | Graceful error handling with user-friendly messages |

### Compliance Sections Analyzed

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLIANCE SECTIONS                          │
├─────────────────┬───────────────────────────────────────────────┤
│ 🔧 Technical    │ Engineering specs, safety requirements,       │
│                 │ infrastructure standards                      │
├─────────────────┼───────────────────────────────────────────────┤
│ 🌿 Environmental│ EIA clearances, fore    st permits,              │
│                 │ water resource management                     │
├─────────────────┼───────────────────────────────────────────────┤
│ 📋 Administrative│ Project approvals, stakeholder              │
│                 │ consultations, regulatory compliance          │
├─────────────────┼───────────────────────────────────────────────┤
│ 💰 Financial    │ Budget allocation, cost-benefit analysis,    │
│                 │ funding schedules                             │
├─────────────────┼───────────────────────────────────────────────┤
│ 👥 Social       │ Community impact, rehabilitation plans,      │
│                 │ local employment provisions                   │
└─────────────────┴───────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+ with pip
- Node.js 18+ with npm
- NVIDIA GPU with CUDA 11.8 (recommended)

### One-Command Setup (Windows)

```powershell
# Clone and setup
git clone https://github.com/your-org/dpr-compliance-system.git
cd dpr-compliance-system

# Backend (Terminal 1)
python -m venv .venv
.\.venv\Scripts\activate
pip install torch --index-url https://download.pytorch.org/whl/cu118
pip install fastapi uvicorn python-multipart pymupdf sentence-transformers faiss-cpu requests
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --port 8000

# Frontend (Terminal 2)
cd Frontend-DPR/frontend
npm install
npm run dev
```

### Access Points
| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:3000 |
| 🔧 Backend API | http://localhost:8000 |
| 📚 API Docs | http://localhost:8000/docs |
| ❤️ Health Check | http://localhost:8000/health |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + TypeScript)                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐  │
│  │   Dashboard    │  │    Upload      │  │      Reports           │  │
│  │   (Stats &     │  │   Documents    │  │   (Analytics &         │  │
│  │    Upload)     │  │   (Dropzone)   │  │    Compliance)         │  │
│  └───────┬────────┘  └───────┬────────┘  └───────────┬────────────┘  │
│          │                   │                       │               │
│          └───────────────────┴───────────────────────┘               │
│                              │                                       │
│                    ┌─────────▼─────────┐                             │
│                    │   API Service     │  (Axios + TypeScript)       │
│                    │   - uploadDPR()   │                             │
│                    │   - pollStatus()  │                             │
│                    │   - getReport()   │                             │
│                    └─────────┬─────────┘                             │
└──────────────────────────────┼───────────────────────────────────────┘
                               │ HTTP REST
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        BACKEND (FastAPI + Python)                    │
│                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐   │
│  │ POST /upload│    │GET /status/ │    │    GET /report/         │   │
│  │             │    │  {job_id}   │    │      {job_id}           │   │
│  └──────┬──────┘    └──────┬──────┘    └───────────┬─────────────┘   │
│         │                  │                       │                 │
│         ▼                  ▼                       ▼                 │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    SERVICES LAYER                            │    │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │    │
│  │  │  PDF Handler   │  │  OCR Pipeline  │  │  RAG Pipeline  │  │    │
│  │  │  (PyMuPDF)     │  │  (PaddleOCR)   │  │  (FAISS+SBERT) │  │    │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                 COMPLIANCE ENGINE                            │    │
│  │  • Section Detection    • Risk Identification                │    │
│  │  • Score Calculation    • Report Generation                  │    │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     ML INFRASTRUCTURE (CUDA)                         │
│  ┌──────────────────────────┐  ┌──────────────────────────────────┐  │
│  │  Sentence-BERT           │  │  FAISS Vector Store              │  │
│  │  (BAAI/bge-base-en-v1.5) │  │  (51 NE-SIDS guideline chunks)  │  │
│  │  Device: CUDA (RTX 4050) │  │  Similarity: Cosine             │  │
│  └──────────────────────────┘  └──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.100+ | Async REST API framework |
| **Uvicorn** | 0.23+ | ASGI server |
| **PyTorch** | 2.7.1+cu118 | Deep learning framework |
| **CUDA** | 11.8 | GPU acceleration |
| **Sentence-Transformers** | 2.2+ | Text embeddings (bge-base-en-v1.5) |
| **FAISS** | 1.7+ | Vector similarity search |
| **PyMuPDF** | 1.23+ | PDF text extraction |
| **PaddleOCR** | 2.7+ | OCR for scanned documents |
| **Pydantic** | 2.0+ | Data validation |

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2 | UI library |
| **TypeScript** | 5.0+ | Type safety |
| **Vite** | 5.0+ | Build tool & dev server |
| **Material-UI** | 5.18+ | Component library |
| **Axios** | 1.4+ | HTTP client |
| **React-Dropzone** | 14.2+ | File upload |
| **Recharts** | 2.15+ | Data visualization |
| **Leaflet** | 1.9+ | Geospatial maps |

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | 4 cores | 8+ cores |
| **RAM** | 8 GB | 16+ GB |
| **GPU** | - | NVIDIA RTX 4050+ (6GB VRAM) |
| **Storage** | 10 GB | 50 GB SSD |

---

## 📁 Project Structure

```
DPR_final/
│
├── 📂 backend/                      # FastAPI Backend Server
│   ├── main.py                      # API endpoints, CORS, lifespan events
│   ├── services.py                  # Business logic, OCR/RAG integration
│   └── schemas.py                   # Pydantic request/response models
│
├── 📂 Frontend-DPR/                 # React Frontend Application
│   ├── 📂 frontend/
│   │   ├── 📂 src/
│   │   │   ├── 📂 components/       # Reusable UI components
│   │   │   │   ├── 📂 chatbot/      # AI chatbot widget
│   │   │   │   │   ├── ChatbotButton.tsx
│   │   │   │   │   └── ChatbotDrawer.tsx
│   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   └── StatCard.tsx
│   │   │   │
│   │   │   ├── 📂 layout/           # Page layout components
│   │   │   │   ├── GovHeader.tsx    # Government header with emblem
│   │   │   │   ├── GovSidebar.tsx   # Navigation sidebar
│   │   │   │   ├── GovFooter.tsx    # Footer with links
│   │   │   │   └── MainLayout.tsx   # Main wrapper
│   │   │   │
│   │   │   ├── 📂 pages/            # Route pages
│   │   │   │   ├── Dashboard.jsx    # Main dashboard with upload
│   │   │   │   ├── UploadDocuments.tsx  # Dedicated upload page
│   │   │   │   ├── Reports.tsx      # Analytics & reports
│   │   │   │   └── GeospatialVerification.tsx
│   │   │   │
│   │   │   ├── 📂 services/         # API integration
│   │   │   │   └── api.ts           # Axios client & API functions
│   │   │   │
│   │   │   ├── App.tsx              # Root component with routing
│   │   │   ├── main.tsx             # Entry point with providers
│   │   │   └── theme.ts             # MUI theme (MDoNER branding)
│   │   │
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── 📂 shared/                   # Shared types & utilities
│       └── 📂 src/
│           ├── types/               # TypeScript interfaces
│           ├── constants/           # Shared constants
│           └── utils/               # Helper functions
│
├── 📂 rag_dpr/                      # RAG Pipeline Module
│   ├── main.py                      # CLI interface
│   ├── 📂 models/
│   │   ├── embeddings.py            # Sentence-BERT wrapper
│   │   └── llm.py                   # LLM integration (optional)
│   ├── 📂 dpr_analysis/
│   │   ├── retriever.py             # FAISS vector retriever
│   │   ├── evaluator.py             # Compliance scoring logic
│   │   ├── context_builder.py       # Context assembly
│   │   └── query_builder.py         # Query construction
│   ├── 📂 ingest/
│   │   ├── parse_pdf.py             # PDF text extraction
│   │   ├── chunker.py               # Text chunking strategies
│   │   └── embed_index.py           # Vector index builder
│   └── 📂 store/
│       └── faiss.index              # Pre-built guideline index (51 chunks)
│
├── 📂 PaddleOCR-DPR-locally/        # OCR Pipeline Module
│   ├── hybrid_ocr_pipeline.py       # Main OCR processor
│   ├── requirements.txt
│   ├── README.md
│   └── USAGE.md
│
├── 📂 uploads/                      # Uploaded PDF storage
├── 📂 .venv/                        # Python virtual environment
│
├── README.md                        # This file
├── requirements.txt                 # Python dependencies
└── .gitignore
```

---

## 🔧 Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/dpr-compliance-system.git
cd dpr-compliance-system
```

### Step 2: Backend Setup

```bash
# Create and activate virtual environment
python -m venv .venv

# Windows
.\.venv\Scripts\activate

# Linux/macOS
source .venv/bin/activate

# Install PyTorch with CUDA 11.8 support
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Install remaining dependencies
pip install fastapi uvicorn[standard] python-multipart
pip install pymupdf sentence-transformers faiss-cpu
pip install requests pydantic

# Verify GPU detection
python -c "import torch; print('CUDA Available:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None')"
```

**Expected Output:**
```
CUDA Available: True
GPU: NVIDIA GeForce RTX 4050 Laptop GPU
```

### Step 3: Frontend Setup

```bash
cd Frontend-DPR/frontend

# Install Node.js dependencies
npm install

# Return to project root
cd ../..
```

### Step 4: Start Services

**Terminal 1 - Backend:**
```bash
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --port 8000 --host 127.0.0.1
```

**Expected Backend Output:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
[ML] Initializing embedding model...
✅ Loaded BAAI/bge-base-en-v1.5 on CUDA
[RAG] Loading FAISS retriever...
✅ FAISS index loaded: 51 vectors, 51 chunks
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Terminal 2 - Frontend:**
```bash
cd Frontend-DPR/frontend
npm run dev
```

**Expected Frontend Output:**
```
VITE v7.3.1  ready in 200 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

---

## ⚙️ Configuration

### Backend Configuration

Edit `backend/main.py`:

```python
# CORS Origins (add your domains)
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://your-domain.com",
]

# File Upload Settings
MAX_FILE_SIZE = 52428800  # 50MB
ALLOWED_EXTENSIONS = [".pdf"]
```

### Frontend Configuration

Edit `Frontend-DPR/frontend/src/services/api.ts`:

```typescript
// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

Or create `.env` file:
```env
VITE_API_URL=http://localhost:8000
```

### ML Model Configuration

The embedding model is set in `rag_dpr/models/embeddings.py`:

```python
MODEL_NAME = "BAAI/bge-base-en-v1.5"  # 768-dim embeddings
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
```

---

## 📖 Usage Guide

### 1. Upload a DPR Document

**Via Dashboard:**
1. Navigate to http://localhost:3000
2. Click **"Select PDF"** or drag-and-drop a PDF file
3. Click **"Start Analysis"**

**Via Upload Documents Page:**
1. Click **"Upload Documents"** in the sidebar
2. Drop your PDF into the upload zone
3. Analysis starts automatically

### 2. Monitor Processing

The UI displays real-time status:

| Stage | Progress | Description |
|-------|----------|-------------|
| 📤 Uploading | 0-30% | File transfer to server |
| 🔍 Processing | 30-80% | OCR + RAG analysis |
| ✅ Complete | 100% | Report ready |

### 3. View Compliance Report

After processing, the report shows:

- **Overall Score** — Circular progress (0-100%)
- **Compliance Status** — COMPLIANT / PARTIAL / NON-COMPLIANT
- **Section Breakdown** — Expandable accordion with:
  - Individual section scores
  - Risk indicators
  - Text previews from document
- **Processing Time** — Seconds taken

### 4. Interpret Results

| Score | Status | Action |
|-------|--------|--------|
| 80-100% | 🟢 COMPLIANT | Ready for approval |
| 50-79% | 🟡 PARTIAL | Address identified gaps |
| 0-49% | 🔴 NON-COMPLIANT | Significant revisions needed |

---

## 📚 API Reference

### Base URL
```
http://localhost:8000
```

### Endpoints

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "DPR Compliance Analysis API",
  "version": "1.0.0"
}
```

---

#### Upload PDF
```http
POST /upload
Content-Type: multipart/form-data
```

**Request:**
```bash
curl -X POST "http://localhost:8000/upload" \
  -F "file=@document.pdf"
```

**Response:**
```json
{
  "job_id": "ABC12345"
}
```

---

#### Check Status
```http
GET /status/{job_id}
```

**Response (Processing):**
```json
{
  "job_id": "ABC12345",
  "status": "PROCESSING",
  "message": "Analyzing document..."
}
```

**Response (Completed):**
```json
{
  "job_id": "ABC12345",
  "status": "COMPLETED",
  "report": {
    "job_id": "ABC12345",
    "status": "COMPLETED",
    "overall_score": 85,
    "sections": {
      "technical": {
        "status": "COMPLIANT",
        "score": 100,
        "risks": [],
        "text_preview": "..."
      },
      "environmental": {
        "status": "PARTIAL",
        "score": 75,
        "risks": ["Missing EIA clearance"],
        "text_preview": "..."
      }
    },
    "processing_time": 2.45
  }
}
```

---

#### Get Full Report
```http
GET /report/{job_id}
```

**Response:** Same as completed status report.

---

### Error Responses

| Code | Description |
|------|-------------|
| 400 | Invalid file type (only PDF allowed) |
| 404 | Job not found |
| 422 | Validation error (malformed request) |
| 500 | Server error |

---

## 🔧 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| **GPU not detected** | CPU-only PyTorch | `pip install torch --index-url https://download.pytorch.org/whl/cu118` |
| **422 Upload Error** | Wrong FormData format | Ensure API receives `File` object, not `FormData` |
| **CORS Error** | Backend not running | Start backend on port 8000 |
| **Blank Frontend** | Build errors | Check browser console (F12), run `npm install` |
| **Slow Processing** | CPU mode | Enable CUDA or use smaller models |
| **[object Object] Error** | Bad error handling | Update to latest `api.ts` with proper error extraction |

### Debug Commands

```bash
# Check backend health
curl http://localhost:8000/health

# Test upload
curl -X POST http://localhost:8000/upload -F "file=@test.pdf"

# Check GPU
python -c "import torch; print(torch.cuda.is_available())"

# Check FAISS index
python -c "import faiss; idx = faiss.read_index('rag_dpr/store/faiss.index'); print(idx.ntotal)"
```

### Logs Location

- **Backend:** Terminal running uvicorn
- **Frontend:** Browser DevTools Console (F12)
- **ML Models:** Loaded on startup (check terminal output)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code Style

- **Python:** Black formatter, type hints
- **TypeScript:** ESLint, Prettier
- **Commits:** Conventional commits

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👥 Acknowledgments

- **Ministry of Development of North Eastern Region (MDoNER)** — Guidelines & Requirements
- **BAAI** — BGE Embedding Models
- **Meta AI** — FAISS Vector Search
- **PaddlePaddle** — PaddleOCR

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/your-org/dpr-compliance-system/issues)
- **Documentation:** [Wiki](https://github.com/your-org/dpr-compliance-system/wiki)
- **Email:** support@example.gov.in

---

<div align="center">

**🇮🇳 Built with ❤️ for Digital India 🇮🇳**

*Transforming Government Processes Through AI*

---

![MDoNER](https://img.shields.io/badge/MDoNER-Approved-0f2c59?style=for-the-badge)
![Made in India](https://img.shields.io/badge/Made%20in-India-ff9933?style=for-the-badge)

</div>
