# SmartShip Startup Script for Windows PowerShell
Clear-Host
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "🚀 Starting SmartShip Logistics Platform Services" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# 1. Start Backend Server
Write-Host "📡 [1/2] Starting Backend Express Server (Port 5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"

# 2. Start Frontend Client
Write-Host "🌐 [2/2] Starting React Frontend Client (Port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"

Write-Host ""
Write-Host "🎉 All services spawned in separate terminal windows!" -ForegroundColor Green
Write-Host "   - Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "   - Backend API: http://localhost:5000/api" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
