$ErrorActionPreference = 'Stop'

$backendDirectory = Join-Path $PSScriptRoot 'backend'
$frontendDirectory = Join-Path $PSScriptRoot 'frontend'
$backendPython = Join-Path $backendDirectory 'venv\Scripts\python.exe'
$commandProcessor = $env:ComSpec

if (-not (Test-Path -LiteralPath $backendPython)) {
    throw "Backend virtual environment not found: $backendPython"
}

if (-not (Test-Path -LiteralPath (Join-Path $frontendDirectory 'package.json'))) {
    throw "Frontend package.json not found in $frontendDirectory."
}

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw 'npm was not found. Install Node.js and ensure npm is on PATH.'
}

$backendCommand = 'title Skillix Backend && "' + $backendPython + '" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001'
$frontendCommand = 'title Skillix Frontend && npm run dev'

Start-Process -FilePath $commandProcessor -WorkingDirectory $backendDirectory -ArgumentList @(
    '/k',
    $backendCommand
)
Start-Process -FilePath $commandProcessor -WorkingDirectory $frontendDirectory -ArgumentList @(
    '/k',
    $frontendCommand
)

Write-Host 'Backend and frontend started in separate windows!' -ForegroundColor Green
Write-Host 'Frontend:    http://localhost:5176' -ForegroundColor Yellow
Write-Host 'Backend API: http://127.0.0.1:8001' -ForegroundColor Yellow
Write-Host 'API Docs:    http://127.0.0.1:8001/docs' -ForegroundColor Yellow
