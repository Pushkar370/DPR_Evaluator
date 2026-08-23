#!/bin/bash
# ==========================================================================
# DPR Compliance Analysis System - Quick Start Script (Linux/macOS)
# ==========================================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo ""
echo "=========================================================================="
echo "   DPR Compliance Analysis System - Quick Start"
echo "=========================================================================="
echo ""

# 1. Check Python
echo "[1/7] Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python not found! Please install Python 3.9 or higher."
    exit 1
fi
python3 --version
echo "✅ Python found"

# 2. Check GPU
echo ""
echo "[2/7] Checking GPU availability..."
python3 -c "import torch; print('✅ GPU Available: ' + str(torch.cuda.is_available()))" 2>/dev/null || echo "⚠️  GPU check failed"

# 3. Install backend dependencies
echo ""
echo "[3/7] Installing backend dependencies..."
pip3 install -q -r backend/requirements.txt || {
    echo "❌ Failed to install dependencies!"
    exit 1
}
echo "✅ Backend dependencies installed"

# 4. Verify uploads directory
echo ""
echo "[4/7] Verifying uploads directory..."
mkdir -p uploads
echo "✅ Uploads directory ready"

# 5. Check FAISS index
echo ""
echo "[5/7] Checking RAG FAISS index..."
if [ ! -f "rag_dpr/store/faiss.index" ]; then
    echo "⚠️  FAISS index not found. Run:"
    echo "    cd rag_dpr"
    echo "    python3 -m ingest.build_knowledge"
    echo "    cd .."
    echo "Then restart this script."
else
    echo "✅ FAISS index exists"
fi

# 6. Install frontend dependencies
echo ""
echo "[6/7] Installing frontend dependencies..."
cd Frontend-DPR/frontend
npm install > /dev/null 2>&1
cd "$ROOT_DIR"
echo "✅ Frontend dependencies installed"

# 7. Success message
echo ""
echo "=========================================================================="
echo "   ✅ Setup Complete!"
echo "=========================================================================="
echo ""
echo "To run the complete system, open TWO SEPARATE terminals:"
echo ""
echo "TERMINAL 1 - Backend (from root directory):"
echo "  cd $ROOT_DIR"
echo "  uvicorn backend.main:app --reload --port 8000"
echo ""
echo "TERMINAL 2 - Frontend (in a new terminal):"
echo "  cd $ROOT_DIR/Frontend-DPR/frontend"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo "API Docs:  http://localhost:8000/docs"
echo "=========================================================================="
echo ""
