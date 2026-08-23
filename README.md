
# 🏛️ DPR Compliance Analysis System

<div align="center">

![Government of India](https://img.shields.io/badge/Government%20of%20India-MDoNER-0f2c59)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)
![CUDA](https://img.shields.io/badge/CUDA-11.8-76B900?logo=nvidia&logoColor=white)

### AI-Powered Development Plan Report (DPR) Compliance Verification System

**Built for the Ministry of Development of North Eastern Region (MDoNER)**

[Overview](#-overview) • [Features](#-features) • [Architecture](#-architecture) • [Setup](#-getting-started) • [API](#-api-reference)

</div>

---

## 📌 Overview

The **DPR Compliance Analysis System** is an AI-powered document verification platform designed to automate the assessment of **Development Plan Reports (DPRs)** against **NE-SIDS (North East Special Infrastructure Development Scheme)** guidelines issued by MDoNER.

### The Problem

Manual DPR verification can be:

- ⏱️ **Time-consuming** — Documents may require days or weeks of review
- ❌ **Error-prone** — Important details can be missed during manual verification
- 📊 **Inconsistent** — Assessment may vary between reviewers
- 💰 **Resource-intensive** — Requires significant involvement from domain experts

### The Solution

The system provides an automated pipeline that:

1. 📄 Extracts text from digital and scanned PDFs
2. 🔍 Retrieves relevant compliance guidelines using vector search
3. 🧠 Analyzes DPR content against applicable requirements
4. 📊 Scores compliance across five major dimensions
5. ⚠️ Identifies risks and missing requirements
6. 📑 Generates a structured compliance report

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **Smart PDF Upload** | Upload DPR documents through a drag-and-drop interface |
| 🔍 **Hybrid OCR** | Combines PyMuPDF and PaddleOCR for digital and scanned PDFs |
| 🧠 **RAG-Based Analysis** | Uses FAISS vector search and Sentence-BERT embeddings to retrieve relevant guidelines |
| 📊 **Multi-Dimensional Scoring** | Evaluates Technical, Environmental, Administrative, Financial and Social compliance |
| ⚡ **GPU Acceleration** | Supports CUDA-based embedding inference |
| 🔄 **Real-Time Processing** | Displays upload and analysis progress |
| 📈 **Compliance Dashboard** | Presents scores, risks and analysis results |
| 🗺️ **Geospatial Verification** | Provides geospatial verification functionality |
| 🎨 **Government-Style UI** | MDoNER-oriented interface and responsive design |
| 🛡️ **Error Handling** | Graceful handling of upload and processing failures |

### Compliance Dimensions

| Dimension | Examples of Checks |
|---|---|
| 🔧 **Technical** | Engineering specifications, safety requirements, infrastructure standards |
| 🌿 **Environmental** | EIA clearances, forest permits, water-resource management |
| 📋 **Administrative** | Approvals, stakeholder consultations, regulatory requirements |
| 💰 **Financial** | Budget allocation, cost-benefit analysis, funding schedules |
| 👥 **Social** | Community impact, rehabilitation and local employment provisions |

---

## 🧠 AI & Analysis Pipeline

```text
                    ┌──────────────────────┐
                    │     DPR PDF Upload   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   PDF Processing     │
                    │   PyMuPDF / OCR      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Text Extraction &    │
                    │ Document Chunking    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Sentence-BERT        │
                    │ Embeddings           │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ FAISS Vector Search  │
                    │ Guideline Retrieval  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Compliance Analysis  │
                    │ & Risk Identification│
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Compliance Score &   │
                    │ Structured Report    │
                    └──────────────────────┘
```

The current implementation uses **51 pre-indexed guideline chunks** in the FAISS store and the `BAAI/bge-base-en-v1.5` embedding model.

---

## 🏗️ Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                    React + TypeScript                        │
│                                                              │
│  Dashboard ─── Upload ─── Reports ─── Geospatial Verification│
└───────────────────────────┬──────────────────────────────────┘
                            │
                         HTTP REST
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                           │
│                                                              │
│  POST /upload   GET /status/{job_id}   GET /report/{job_id} │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                     Services Layer                           │
│                                                              │
│  PDF Handler ─── OCR Pipeline ─── RAG Pipeline              │
│  PyMuPDF         PaddleOCR       FAISS + SBERT               │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   Compliance Engine                          │
│                                                              │
│  Section Detection • Risk Identification                     │
│  Score Calculation • Report Generation                       │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                  ML Infrastructure                           │
│                                                              │
│  BAAI/bge-base-en-v1.5  +  FAISS Vector Store               │
│  CUDA acceleration        51 guideline chunks                │
└──────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| **Python 3.10+** | Core backend and ML pipeline |
| **FastAPI** | REST API framework |
| **Uvicorn** | ASGI server |
| **PyTorch** | Deep-learning framework |
| **CUDA 11.8** | GPU acceleration |
| **Sentence-Transformers** | Text embeddings |
| **FAISS** | Vector similarity search |
| **PyMuPDF** | PDF text extraction |
| **PaddleOCR** | OCR for scanned documents |
| **Pydantic** | Request/response validation |

### Frontend

| Technology | Purpose |
|---|---|
| **React 18.2** | User interface |
| **TypeScript 5.0+** | Type-safe frontend development |
| **Vite** | Build tool and development server |
| **Material UI** | UI components |
| **Axios** | API communication |
| **React Dropzone** | PDF upload interface |
| **Recharts** | Data visualization |
| **Leaflet** | Geospatial visualization |

---

## 📁 Project Structure

```text
DPR_final/
│
├── backend/
│   ├── main.py                 # FastAPI application & endpoints
│   ├── services.py             # OCR/RAG and business logic
│   └── schemas.py              # Pydantic models
│
├── Frontend-DPR/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── chatbot/
│   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   └── StatCard.tsx
│   │   │   ├── layout/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   │   └── api.ts
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── theme.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── shared/
│       └── src/
│           ├── types/
│           ├── constants/
│           └── utils/
│
├── rag_dpr/
│   ├── main.py
│   ├── models/
│   │   ├── embeddings.py
│   │   └── llm.py
│   ├── dpr_analysis/
│   │   ├── retriever.py
│   │   ├── evaluator.py
│   │   ├── context_builder.py
│   │   └── query_builder.py
│   ├── ingest/
│   │   ├── parse_pdf.py
│   │   ├── chunker.py
│   │   └── embed_index.py
│   └── store/
│       └── faiss.index
│
├── PaddleOCR-DPR-locally/
│   ├── hybrid_ocr_pipeline.py
│   ├── requirements.txt
│   ├── README.md
│   └── USAGE.md
│
├── uploads/
├── requirements.txt
├── .gitignore
└── README.md
```

> **Note:** Do not commit `.venv/`, uploaded documents, API keys, model secrets or other sensitive/generated files to Git.

---

## 💻 System Requirements

### Software

- Python **3.10+**
- Node.js **18+**
- npm
- Git
- NVIDIA CUDA 11.8 *(recommended for GPU acceleration)*

### Hardware

| Component | Minimum | Recommended |
|---|---:|---:|
| CPU | 4 cores | 8+ cores |
| RAM | 8 GB | 16 GB |
| GPU | Optional | NVIDIA RTX 4050+ / 6 GB VRAM |
| Storage | 10 GB | 50 GB SSD |

> The system can run without a GPU, but ML inference may be slower in CPU mode.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/dpr-compliance-system.git
cd dpr-compliance-system
```

### 2. Create Python Environment

```bash
python -m venv .venv
```

#### Windows

```powershell
.\.venv\Scripts\activate
```

#### Linux / macOS

```bash
source .venv/bin/activate
```

### 3. Install Backend Dependencies

For CUDA 11.8:

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

Install remaining dependencies:

```bash
pip install fastapi "uvicorn[standard]" python-multipart
pip install pymupdf sentence-transformers faiss-cpu
pip install requests pydantic
```

### 4. Verify CUDA

```bash
python -c "import torch; print('CUDA Available:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None')"
```

Expected GPU-enabled output:

```text
CUDA Available: True
GPU: NVIDIA GeForce RTX 4050 Laptop GPU
```

### 5. Install Frontend Dependencies

```bash
cd Frontend-DPR/frontend
npm install
cd ../..
```

### 6. Start Backend

Open **Terminal 1**:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --port 8000 --host 127.0.0.1
```

### 7. Start Frontend

Open **Terminal 2**:

```bash
cd Frontend-DPR/frontend
npm run dev
```

---

## 🌐 Local Access

| Service | URL |
|---|---|
| 🌐 Frontend | `http://localhost:3000` |
| 🔧 Backend API | `http://localhost:8000` |
| 📚 Swagger API Docs | `http://localhost:8000/docs` |
| ❤️ Health Check | `http://localhost:8000/health` |

---

## ⚙️ Configuration

### Backend

The backend supports configuration for:

- CORS origins
- Maximum upload size
- Allowed file extensions

Example:

```python
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
]

MAX_FILE_SIZE = 52428800  # 50 MB
ALLOWED_EXTENSIONS = [".pdf"]
```

### Frontend

Create:

```text
Frontend-DPR/frontend/.env
```

Add:

```env
VITE_API_URL=http://localhost:8000
```

### Embedding Model

The current RAG pipeline uses:

```python
MODEL_NAME = "BAAI/bge-base-en-v1.5"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
```

---

## 📖 Usage

### Step 1 — Upload DPR

1. Open the dashboard.
2. Select or drag-and-drop a PDF.
3. Start the analysis.

### Step 2 — Monitor Processing

The system provides progress updates for:

```text
Uploading       → 0–30%
Processing       → 30–80%
Completed        → 100%
```

### Step 3 — Review Compliance Report

The generated report provides:

- Overall compliance score
- Compliance status
- Section-wise scores
- Identified risks
- Relevant document text
- Processing time

### Compliance Interpretation

| Score | Status | Interpretation |
|---:|---|---|
| **80–100%** | 🟢 COMPLIANT | Ready for approval |
| **50–79%** | 🟡 PARTIAL | Identified gaps should be addressed |
| **0–49%** | 🔴 NON-COMPLIANT | Significant revisions required |

---

## 🔌 API Reference

### Health Check

```http
GET /health
```

Example response:

```json
{
  "status": "healthy",
  "service": "DPR Compliance Analysis API",
  "version": "1.0.0"
}
```

### Upload DPR

```http
POST /upload
Content-Type: multipart/form-data
```

Example:

```bash
curl -X POST "http://localhost:8000/upload" \
  -F "file=@document.pdf"
```

Response:

```json
{
  "job_id": "ABC12345"
}
```

### Check Processing Status

```http
GET /status/{job_id}
```

Processing response:

```json
{
  "job_id": "ABC12345",
  "status": "PROCESSING",
  "message": "Analyzing document..."
}
```

Completed response:

```json
{
  "job_id": "ABC12345",
  "status": "COMPLETED",
  "report": {
    "overall_score": 85,
    "sections": {
      "technical": {
        "status": "COMPLIANT",
        "score": 100,
        "risks": []
      },
      "environmental": {
        "status": "PARTIAL",
        "score": 75,
        "risks": [
          "Missing EIA clearance"
        ]
      }
    },
    "processing_time": 2.45
  }
}
```

### Get Full Report

```http
GET /report/{job_id}
```

### Error Responses

| Status | Meaning |
|---:|---|
| `400` | Invalid file type |
| `404` | Job not found |
| `422` | Validation error |
| `500` | Internal server error |

---

## 🔍 RAG Pipeline

The Retrieval-Augmented Generation component consists of:

```text
Guideline Documents
       │
       ▼
PDF Parsing
       │
       ▼
Text Chunking
       │
       ▼
Sentence-BERT Embeddings
       │
       ▼
FAISS Vector Index
       │
       ▼
Query Construction
       │
       ▼
Relevant Guideline Retrieval
       │
       ▼
Compliance Evaluation
```

### Current Vector Store

- **Embedding model:** `BAAI/bge-base-en-v1.5`
- **Vector database:** FAISS
- **Indexed guideline chunks:** 51
- **Similarity:** Cosine similarity
- **Acceleration:** CUDA when available

---

## 🔍 OCR Pipeline

The system uses a hybrid PDF extraction approach:

```text
             PDF
              │
       ┌──────┴──────┐
       │             │
 Digital PDF      Scanned PDF
       │             │
       ▼             ▼
   PyMuPDF       PaddleOCR
       │             │
       └──────┬──────┘
              ▼
        Extracted Text
```

This allows the system to process both digitally generated and scanned DPR documents.

---

## 🐛 Troubleshooting

| Problem | Possible Cause | Solution |
|---|---|---|
| GPU not detected | CPU-only PyTorch installed | Install CUDA-compatible PyTorch |
| `422` upload error | Incorrect multipart request | Send the PDF as a file field |
| CORS error | Backend unavailable | Start the FastAPI server |
| Blank frontend | Frontend/build issue | Run `npm install` and inspect browser console |
| Slow processing | CPU inference | Enable CUDA if supported |
| FAISS loading issue | Missing/invalid index | Verify `rag_dpr/store/faiss.index` |

### Useful Debug Commands

Check backend:

```bash
curl http://localhost:8000/health
```

Test upload:

```bash
curl -X POST http://localhost:8000/upload -F "file=@test.pdf"
```

Check CUDA:

```bash
python -c "import torch; print(torch.cuda.is_available())"
```

Check FAISS index:

```bash
python -c "import faiss; idx = faiss.read_index('rag_dpr/store/faiss.index'); print(idx.ntotal)"
```

---

## 🤝 Contributing

Contributions are welcome.

### Workflow

```bash
# Fork the repository

git checkout -b feature/your-feature

git add .

git commit -m "feat: add your feature"

git push origin feature/your-feature
```

Then open a Pull Request.

### Code Style

- **Python:** Black + type hints
- **TypeScript:** ESLint + Prettier
- **Commits:** Conventional commit style

---

## 🔮 Future Scope

Potential extensions include:

- Advanced LLM-based compliance reasoning
- Larger and continuously updated guideline knowledge base
- Automated recommendation generation
- Explainable compliance decisions
- Document comparison across DPR versions
- Role-based government workflows
- Cloud deployment and scalable processing
- Advanced geospatial validation
- Audit trails and reviewer feedback loops

---

## 📄 License

This project is licensed under the **MIT License**.

See [`LICENSE`](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Ministry of Development of North Eastern Region (MDoNER)** — Guidelines and requirements
- **BAAI** — BGE embedding models
- **Meta AI** — FAISS vector search
- **PaddlePaddle** — PaddleOCR
- **PyTorch** — Machine learning infrastructure
- **FastAPI** — Backend API framework
- **React** — Frontend framework

---

## 👥 Project

**DPR Compliance Analysis System**

> AI-assisted compliance verification for Development Plan Reports under NE-SIDS guidelines.

**Made in India 🇮🇳**

---

<div align="center">

### 🏛️ Transforming Government Document Verification Through AI

**Built with ❤️ for Digital India**

</div>
