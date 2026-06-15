@echo off
echo ==========================================================
echo SmartShip Logistics Platform Startup Launcher
echo ==========================================================

echo.
echo 🤖 [1/3] Starting AI/ML Prediction Microservice (Port 5001)...
start cmd /k "title SmartShip ML-Service && cd ml-service && python app.py"

echo 📡 [2/3] Starting Backend Express Server (Port 5000)...
start cmd /k "title SmartShip Express Server && cd server && npm run dev"

echo 🌐 [3/3] Starting React Frontend Client (Port 5173)...
start cmd /k "title SmartShip React Client && cd client && npm run dev"

echo.
echo 🎉 All services spawned in separate terminal windows!
echo    - Frontend: http://localhost:5173
echo    - Backend API: http://localhost:5000/api
echo    - ML Service: http://localhost:5001
echo ==========================================================
pause
