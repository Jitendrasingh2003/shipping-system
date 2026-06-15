# SmartShip Startup Script for Windows PowerShell
Clear-Host
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "🚀 Starting SmartShip Logistics Platform Services" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# 1. Start ML Microservice
Write-Host ""
Write-Host "🤖 [1/3] Starting AI/ML Prediction Microservice (Port 5001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ml-service; python app.py"

# 2. Start Backend Server
Write-Host "📡 [2/3] Starting Backend Express Server (Port 5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"

# 3. Start Frontend Client
Write-Host "🌐 [3/3] Starting React Frontend Client (Port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"

Write-Host ""
Write-Host "🎉 All services spawned in separate terminal windows!" -ForegroundColor Green
Write-Host "   - Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "   - Backend API: http://localhost:5000/api" -ForegroundColor Green
Write-Host "   - ML Service: http://localhost:5001" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
