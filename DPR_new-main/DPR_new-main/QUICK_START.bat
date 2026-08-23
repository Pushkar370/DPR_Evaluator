@echo off
REM ==========================================================================
REM DPR Compliance Analysis System - Quick Start Script
REM ==========================================================================
REM This script sets up and runs the complete integrated system
REM

setlocal enabledelayedexpansion

echo.
echo ==========================================================================
echo   DPR Compliance Analysis System - Quick Start
echo ==========================================================================
echo.

REM Get the root directory
for %%A in ("%~dp0.") do set "ROOT_DIR=%%~dpA"
cd /d "%ROOT_DIR%"

echo [1/7] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.9 or higher.
    pause
    exit /b 1
)
echo ✅ Python found

echo.
echo [2/7] Checking GPU availability...
python -c "import torch; print('✅ GPU Available: ' + str(torch.cuda.is_available()))" 2>nul || (
    echo ⚠️  GPU check failed. Ensure PyTorch is installed.
)

echo.
echo [3/7] Installing backend dependencies...
pip install -q -r backend\requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install backend dependencies!
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed

echo.
echo [4/7] Verifying uploads directory...
if not exist uploads mkdir uploads
echo ✅ Uploads directory ready

echo.
echo [5/7] Building RAG FAISS index (if needed)...
if not exist rag_dpr\store\faiss.index (
    echo ⚠️  FAISS index not found. Run:
    echo    cd rag_dpr
    echo    python -m ingest.build_knowledge
    echo    cd ..
    echo Then restart this script.
) else (
    echo ✅ FAISS index exists
)

echo.
echo ==========================================================================
echo   ✅ Setup Complete!
echo ==========================================================================
echo.
echo To run the complete system, open TWO SEPARATE terminals:
echo.
echo TERMINAL 1 - Backend (from root directory):
echo   cd /d "%ROOT_DIR%"
echo   uvicorn backend.main:app --reload --port 8000
echo.
echo TERMINAL 2 - Frontend (in a new terminal):
echo   cd /d "%ROOT_DIR%\Frontend-DPR\frontend"
echo   npm run dev
echo.
echo Then open: http://localhost:5173
echo.
echo API Docs:  http://localhost:8000/docs
echo ==========================================================================
echo.
pause
