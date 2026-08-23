# DPR Compliance Analysis System - Backend Integration Guide

## Overview

This document provides complete setup instructions for the integrated DPR (Development Plan Report) Compliance Analysis System with FastAPI backend and React frontend.

### Architecture

```
Root/
├── ocr_pipeline/              # Contains hybrid_ocr_pipeline.py
├── rag_pipeline/              # Contains main.py with RAG logic
├── Frontend-DPR/              # React frontend
├── backend/                   # FastAPI backend (NEW)
│   ├── __init__.py
│   ├── schemas.py            # Pydantic models
│   ├── services.py           # Business logic (OCR + RAG)
│   ├── main.py               # FastAPI app
│   └── requirements.txt       # Python dependencies
└── uploads/                   # Temporary PDF storage

```

## PART 1: Backend Setup

### Step 1: Install Backend Dependencies

```bash
# Navigate to root directory
cd c:\Users\Ojas Bhalerao\Documents\DPR_final

# Create virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt
```

### Step 2: Verify GPU Configuration

Before running the backend, ensure your RTX 4050 is properly configured:

```bash
python -c "import torch; print(f'GPU Available: {torch.cuda.is_available()}'); print(f'GPU Name: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"None\"}')"
```

**Expected Output:**
```
GPU Available: True
GPU Name: NVIDIA GeForce RTX 4050
```

### Step 3: Run the Backend

**CRITICAL:** Run from the **ROOT** directory (not from inside `backend/`) so Python can find the sibling packages.

```bash
# From Root_Folder/
uvicorn backend.main:app --reload --port 8000
```

**Expected Output:**
```
=========================================================================
🚀 DPR Backend Startup - Initializing ML Models
=========================================================================

[1/2] Loading OCR Pipeline (PaddleOCR + PyMuPDF)...
      ✅ OCR Pipeline ready

[2/2] Loading RAG Components (Embeddings + FAISS)...
      ✅ RAG Components ready

=========================================================================
✅ All models initialized successfully!
=========================================================================

INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Press CTRL+C to quit
```

### Step 4: Verify Backend is Running

Open your browser and visit:
- **API Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health

---

## PART 2: Frontend Setup

### Step 1: Install Frontend Dependencies

```bash
# Navigate to frontend directory
cd Frontend-DPR/frontend

# Install dependencies
npm install

# Make sure axios is installed (for API calls)
npm install axios
```

### Step 2: Configure API URL (Optional)

The frontend defaults to `http://localhost:8000`. To change it:

**Option A: Environment Variable**
```bash
# Create .env file in Frontend-DPR/frontend/
echo "REACT_APP_API_URL=http://localhost:8000" > .env
```

**Option B: Update in Code**
Edit `src/services/api.js` line 5:
```javascript
const API_BASE_URL = 'http://YOUR_API_URL:8000';
```

### Step 3: Run the Frontend

```bash
# From Frontend-DPR/frontend/
npm run dev
# or for production build
npm run build
```

**Expected Output:**
```
VITE v4.x.x  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

---

## PART 3: API Endpoints Reference

### 1. Upload PDF for Analysis

**Endpoint:** `POST /upload`

**Request:**
```bash
curl -X POST "http://localhost:8000/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/document.pdf"
```

**Response (200 OK):**
```json
{
  "job_id": "A1B2C3D4",
  "message": "File uploaded successfully"
}
```

### 2. Check Job Status

**Endpoint:** `GET /status/{job_id}`

**Request:**
```bash
curl "http://localhost:8000/status/A1B2C3D4"
```

**Response (Processing):**
```json
{
  "job_id": "A1B2C3D4",
  "status": "PROCESSING",
  "report": null
}
```

**Response (Completed):**
```json
{
  "job_id": "A1B2C3D4",
  "status": "COMPLETED",
  "report": {
    "job_id": "A1B2C3D4",
    "status": "COMPLETED",
    "overall_score": 85,
    "sections": {
      "technical": {
        "status": "COMPLIANT",
        "risks": [],
        "text_preview": "Technical requirements met...",
        "score": 90
      },
      "environmental": {
        "status": "PARTIAL",
        "risks": ["Missing environmental clearance"],
        "text_preview": "Environmental assessment...",
        "score": 75
      }
    },
    "processing_time": 45.23
  }
}
```

### 3. Get Full Report

**Endpoint:** `GET /report/{job_id}`

**Request:**
```bash
curl "http://localhost:8000/report/A1B2C3D4"
```

**Response:** Same as `/status` report object

---

## PART 4: Frontend Components

### Dashboard Component

**File:** `Frontend-DPR/frontend/src/pages/Dashboard.jsx`

**Features:**
- PDF file upload with validation
- Real-time status polling (2-second intervals)
- Animated compliance score display
- Section-by-section breakdown with progress bars
- Risk identification and display
- Error handling with user-friendly messages

**Key Hooks:**
```javascript
const [selectedFile, setSelectedFile] = useState(null);
const [jobId, setJobId] = useState(null);
const [report, setReport] = useState(null);
const [isPolling, setIsPolling] = useState(false);
const [error, setError] = useState(null);
```

### API Service

**File:** `Frontend-DPR/frontend/src/services/api.js`

**Key Functions:**
```javascript
uploadDPR(formData)              // Upload file
pollStatus(jobId)                // Get status once
pollStatusUntilComplete(jobId)   // Poll until done
getReport(jobId)                 // Get full report
checkHealth()                    // API health check
createFormData(file)             // Helper for file upload
```

---

## PART 5: GPU Memory Management

### Memory Optimization

The backend implements several optimizations for the RTX 4050 (6GB VRAM):

1. **Global Model Initialization:** Models are loaded once at startup, not per request
2. **CUDA Cache Clearing:** After OCR, CUDA cache is cleared before RAG
3. **Async Processing:** Heavy operations run in thread pool, not blocking main thread

### Monitor GPU Usage

```bash
# In a separate terminal, monitor GPU
nvidia-smi -l 1
```

### Troubleshooting OOM Errors

If you get CUDA out-of-memory errors:

1. **Reduce DPI:** In `backend/services.py`, change:
   ```python
   HybridOCRPipeline(dpi=150)  # Instead of 300
   ```

2. **Reduce batch size:** Contact DPR pipeline maintainers

3. **Clear cache manually:** Add to `backend/services.py`:
   ```python
   import torch
   torch.cuda.empty_cache()
   ```

---

## PART 6: Error Handling

### Common Issues and Solutions

#### Issue 1: `ModuleNotFoundError: No module named 'ocr_pipeline'`

**Solution:** Ensure you're running the backend from the **ROOT** directory:
```bash
cd c:\Users\Ojas Bhalerao\Documents\DPR_final
uvicorn backend.main:app --reload --port 8000
```

#### Issue 2: `FileNotFoundError: FAISS index not found`

**Solution:** Build the FAISS index first:
```bash
cd rag_pipeline
python -m ingest.build_knowledge
```

#### Issue 3: CUDA out of memory

**Solution:** 
```python
# In services.py, reduce DPI
OCR_PIPELINE = HybridOCRPipeline(dpi=150)
```

#### Issue 4: CORS error in React console

**Solution:** Ensure backend is running on port 8000 and frontend is on 3000/5173

```javascript
// Verify in api.js
const API_BASE_URL = 'http://localhost:8000';
```

#### Issue 5: Polling timeout after 10 minutes

**Solution:** Increase max attempts in `Dashboard.jsx`:
```javascript
await pollStatusUntilComplete(
  jId,
  onUpdate,
  600  // 20 minutes instead of 300 (10 minutes)
);
```

---

## PART 7: Execution Checklist

Use this checklist to verify the system is correctly set up:

```bash
# 1. Check Python version (3.9+)
python --version
✓ Python 3.10+

# 2. Check GPU availability
python -c "import torch; print(torch.cuda.is_available())"
✓ True

# 3. Install backend requirements
pip install -r backend/requirements.txt
✓ All packages installed

# 4. Create uploads directory
mkdir uploads
✓ Directory exists

# 5. Start backend (from root)
uvicorn backend.main:app --reload --port 8000
✓ Models initialized in ~30-60 seconds

# 6. Verify API is running
curl http://localhost:8000/health
✓ Returns {"status": "healthy"}

# 7. Install frontend dependencies
cd Frontend-DPR/frontend && npm install
✓ Dependencies installed

# 8. Start frontend
npm run dev
✓ Running on http://localhost:5173

# 9. Test upload in browser
# Navigate to http://localhost:5173
# Upload a PDF
✓ Job ID generated

# 10. Check polling
curl http://localhost:8000/status/JOBID
✓ Status updates from PROCESSING to COMPLETED
```

---

## PART 8: Performance Expectations

### Processing Times (RTX 4050)

| Document Size | OCR Time | RAG Time | Total |
|---------------|----------|----------|-------|
| 10 pages      | 8-12s    | 5-8s     | 15-20s |
| 50 pages      | 30-40s   | 8-12s    | 40-50s |
| 100+ pages    | 60-90s   | 10-15s   | 70-105s |

### Memory Usage

| Component | VRAM Used |
|-----------|-----------|
| PaddleOCR | ~2.5 GB   |
| Embeddings | ~1.5 GB  |
| FAISS Index | ~1.0 GB  |
| Buffer    | ~0.5 GB   |
| **Total** | **~5.5 GB** |

---

## PART 9: Production Deployment

### For Production (not localhost):

1. **Update CORS origins** in `backend/main.py`:
```python
ALLOWED_ORIGINS = [
    "https://your-frontend-domain.com",
    "https://your-api-domain.com",
]
```

2. **Use environment variables**:
```python
import os
API_DOMAIN = os.getenv('API_DOMAIN', 'localhost:8000')
```

3. **Run with production server**:
```bash
gunicorn backend.main:app --workers 1 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

4. **Enable HTTPS** with reverse proxy (Nginx/Apache)

---

## PART 10: Debugging Tips

### Enable Verbose Logging

```python
# In backend/services.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Monitor Request Flow

```javascript
// In Frontend Dashboard.jsx
console.log('[Dashboard] Upload started');
console.log('[Dashboard] Job ID:', jobId);
console.log('[Dashboard] Status update:', status);
```

### Check Backend Logs

```bash
# Terminal running backend will show:
[{timestamp}] OCR extraction started...
[{timestamp}] ✅ OCR completed
[{timestamp}] RAG analysis starting...
[{timestamp}] ✅ RAG analysis completed
```

---

## Summary

You now have a fully integrated system:

✅ **Backend** - FastAPI with OCR + RAG pipelines  
✅ **Frontend** - React with polling and real-time updates  
✅ **GPU Optimized** - Models loaded once, async processing  
✅ **Error Handling** - Comprehensive error messages  
✅ **CORS Enabled** - Frontend can communicate with backend  

**Next Step:** Open http://localhost:5173 and upload your first DPR document!

---

## Support

For issues, check:
1. Backend logs (`uvicorn output`)
2. Browser console (`F12` → Console tab)
3. Network tab (`F12` → Network tab)
4. This guide's "Troubleshooting" section
