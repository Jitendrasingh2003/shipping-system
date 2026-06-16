@echo off
echo ==========================================================
echo SmartShip Logistics Platform Startup Launcher
echo ==========================================================

echo.
echo 📡 [1/2] Starting Backend Express Server (Port 5000)...
start cmd /k "title SmartShip Express Server && cd server && npm run dev"

echo 🌐 [2/2] Starting React Frontend Client (Port 5173)...
start cmd /k "title SmartShip React Client && cd client && npm run dev"

echo.
echo 🎉 All services spawned in separate terminal windows!
echo    - Frontend: http://localhost:5173
echo    - Backend API: http://localhost:5000/api
echo ==========================================================
pause
