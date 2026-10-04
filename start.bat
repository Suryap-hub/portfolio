@echo off
cd /d "%~dp0"
echo Starting Surya's AI portfolio...
start "Portfolio backend" cmd /c "backend\run-backend.bat"
start "Portfolio frontend" cmd /c "frontend\run-frontend.bat"
echo.
echo Two windows opened: backend and frontend. Keep both open.
echo The site opens in your browser when it's ready.
echo.
:wait
timeout /t 3 /nobreak >nul
powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://localhost:3000) | Out-Null; exit 0 } catch { exit 1 }" >nul 2>nul
if errorlevel 1 goto wait
start "" http://localhost:3000
