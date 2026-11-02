@echo off
echo Starting Skillix AI Platform...

start "Skillix Backend (FastAPI)" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8001"
start "Skillix Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Backend and Frontend servers launched in new windows.
echo Frontend:    http://localhost:5176
echo Backend API: http://127.0.0.1:8001
echo API Docs:    http://127.0.0.1:8001/docs
