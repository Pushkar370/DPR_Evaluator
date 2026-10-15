#!/bin/bash
# ==========================================================================
# DPR Compliance Analysis System - Quick Start Script (macOS / Linux)
# ==========================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "=========================================================================="
echo "   DPR Compliance & Quality Assessment System (LangGraph Multi-Agent)"
echo "=========================================================================="
echo ""

# 1. Python Environment
echo "[1/5] Checking Python environment..."
if [ -f ".venv/bin/python" ]; then
    PYTHON_BIN=".venv/bin/python"
    echo "[OK] Using virtual environment (.venv)"
else
    if ! command -v python3 &> /dev/null; then
        echo "[ERROR] Python 3 not found. Please install Python 3.10+."
        exit 1
    fi
    PYTHON_BIN="python3"
    echo "[OK] Using system Python: $(python3 --version)"
fi

# 2. Config File (.env)
echo ""
echo "[2/5] Checking .env configuration..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "[INFO] Created .env from .env.example. Add your GEMINI_API_KEY_1 in .env."
    else
        echo "[WARN] .env not found. Please create one with your LLM API keys."
    fi
else
    echo "[OK] .env file detected"
fi

# 3. Database & Vector Store
echo ""
echo "[3/5] Verifying SQLite database and Qdrant guidelines collection..."
$PYTHON_BIN -c "from backend.database import init_db; init_db(); print('[OK] SQLite schema verified')"
$PYTHON_BIN -c "from backend.rag_service import document_rag; print('[OK] Qdrant status: Guidelines loaded = ' + str(document_rag.has_guidelines()))"

# 4. Frontend Dependencies
echo ""
echo "[4/5] Checking Frontend dependencies..."
if command -v npm &> /dev/null; then
    if [ ! -d "Frontend-DPR/node_modules" ]; then
        echo "[INFO] Installing frontend dependencies..."
        (cd Frontend-DPR && npm install)
    else
        echo "[OK] Frontend dependencies installed"
    fi
else
    echo "[WARN] npm not found. Install Node.js 18+ to run the web frontend."
fi

echo ""
echo "=========================================================================="
echo "   Setup Verification Complete!"
echo "=========================================================================="
echo ""
echo "To run the application, open TWO separate terminals:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd $SCRIPT_DIR"
echo "  $PYTHON_BIN -m uvicorn backend.main:app --port 8000"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd $SCRIPT_DIR/Frontend-DPR"
echo "  npm run dev"
echo ""
echo "UI Dashboard: http://localhost:3000"
echo "API Docs:     http://localhost:8000/docs"
echo "Health Check: http://localhost:8000/health"
echo "=========================================================================="
echo ""
