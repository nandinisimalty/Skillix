@echo off
echo Starting Skillix AI Platform...

start "Skillix Backend (FastAPI)" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"
start "Skillix Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Backend and Frontend servers launched in new windows.
echo Frontend:    http://localhost:5173
echo Backend API: http://localhost:8000
echo API Docs:    http://localhost:8000/docs
