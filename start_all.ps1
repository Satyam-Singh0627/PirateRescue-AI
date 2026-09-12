# 🏴‍☠️ Pirate Island Rescue Coordinator - One-Click Launcher
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host " 🏴‍☠️ PIRATE ISLAND RESCUE COORDINATOR LAUNCHER" -ForegroundColor Gold
Write-Host "========================================================" -ForegroundColor Yellow

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "pirate_backend"
$frontendPath = Join-Path $scriptPath "pirate_frontend"

Write-Host "`n⚓ Step 1: Starting Python FastAPI Backend (Port 8000)..." -ForegroundColor Cyan
$backendProcess = Start-Process python -ArgumentList "-m uvicorn main:app --host 127.0.0.1 --port 8000" -WorkingDirectory $backendPath -PassThru

Start-Sleep -Seconds 3

Write-Host "⚓ Step 2: Starting React Vite Frontend (Port 3000)..." -ForegroundColor Cyan
$frontendProcess = Start-Process npm -ArgumentList "run dev" -WorkingDirectory $frontendPath -PassThru

Start-Sleep -Seconds 2

Write-Host "`n✅ Fleet deployed successfully!" -ForegroundColor Green
Write-Host "🌐 Frontend Dashboard: http://localhost:3000" -ForegroundColor Yellow
Write-Host "📡 Backend API Docs:   http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "`nPress Ctrl+C in the spawned terminal windows to dock the fleet." -ForegroundColor Gray
