@echo off
setlocal

set "PROJECT_ROOT=%~dp0"
set "BACKEND_PYTHON=%PROJECT_ROOT%backend\venv\Scripts\python.exe"

if not exist "%BACKEND_PYTHON%" (
    echo Backend virtual environment not found: "%BACKEND_PYTHON%"
    exit /b 1
)

if not exist "%PROJECT_ROOT%frontend\package.json" (
    echo Frontend package.json not found in "%PROJECT_ROOT%frontend".
    exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
    echo npm was not found. Install Node.js and ensure npm is on PATH.
    exit /b 1
)

start "Skillix Backend (FastAPI)" /D "%PROJECT_ROOT%backend" cmd /k ""%BACKEND_PYTHON%" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001"
start "Skillix Frontend (Vite)" /D "%PROJECT_ROOT%frontend" cmd /k "npm run dev"

echo Backend and frontend started in separate windows.
echo Frontend:    http://localhost:5176
echo Backend API: http://127.0.0.1:8001
echo API Docs:    http://127.0.0.1:8001/docs
