Write-Host "Starting Skillix AI Platform..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8001"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; npm run dev"

Write-Host "Both servers launched in separate windows!" -ForegroundColor Green
Write-Host "Frontend:    http://localhost:5176" -ForegroundColor Yellow
Write-Host "Backend API: http://127.0.0.1:8001" -ForegroundColor Yellow
Write-Host "API Docs:    http://127.0.0.1:8001/docs" -ForegroundColor Yellow
