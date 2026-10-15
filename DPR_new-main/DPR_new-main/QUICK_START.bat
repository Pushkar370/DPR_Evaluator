@echo off
REM ==========================================================================
REM DPR Compliance Analysis System - Quick Start Script (Windows)
REM ==========================================================================
setlocal enabledelayedexpansion

echo.
echo ==========================================================================
echo   DPR Compliance & Quality Assessment System (LangGraph Multi-Agent)
echo ==========================================================================
echo.

REM Navigate to project root
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo [1/5] Checking Python environment...
if exist ".venv\Scripts\python.exe" (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
    echo [OK] Using virtual environment (.venv)
) else (
    where python >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Python not found. Please install Python 3.10+ and add it to PATH.
        pause
        exit /b 1
    )
    set "PYTHON_EXE=python"
    echo [OK] Using system Python
)

echo.
echo [2/5] Checking Environment Configuration (.env)...
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [INFO] Created .env from .env.example. Please add your GEMINI_API_KEY_1 in .env
    ) else (
        echo [WARN] .env not found. Please create .env with your LLM API keys.
    )
) else (
    echo [OK] .env file detected
)

echo.
echo [3/5] Verifying SQLite database and Qdrant guidelines collection...
"%PYTHON_EXE%" -c "from backend.database import init_db; init_db(); print('[OK] SQLite schema verified')"
"%PYTHON_EXE%" -c "from backend.rag_service import document_rag; print('[OK] Qdrant status: Guidelines loaded = ' + str(document_rag.has_guidelines()))"

echo.
echo [4/5] Checking Node.js and Frontend dependencies...
where npm >nul 2>&1
if errorlevel 1 (
    echo [WARN] Node.js/npm not found. Please install Node.js 18+ to run the frontend.
) else (
    if not exist "Frontend-DPR\node_modules" (
        echo [INFO] Installing frontend dependencies...
        cd Frontend-DPR && npm install && cd ..
    ) else (
        echo [OK] Frontend dependencies installed
    )
)

echo.
echo ==========================================================================
echo   Setup Verification Complete!
echo ==========================================================================
echo.
echo To launch the system, run in TWO separate terminal windows:
echo.
echo Terminal 1 - Backend:
echo   cd "%SCRIPT_DIR%"
echo   .venv\Scripts\python.exe -m uvicorn backend.main:app --port 8000
echo.
echo Terminal 2 - Frontend:
echo   cd "%SCRIPT_DIR%\Frontend-DPR"
echo   npm run dev
echo.
echo UI Dashboard: http://localhost:3000
echo API Docs:     http://localhost:8000/docs
echo Health Check: http://localhost:8000/health
echo ==========================================================================
echo.
pause
