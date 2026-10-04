@echo off
title Portfolio frontend (Next.js)
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js 20 or newer from nodejs.org.
  pause
  exit /b 1
)

rem Install packages on the first run, and again whenever package.json changes.
fc /b "package.json" "node_modules\.package-json-installed" >nul 2>nul
if errorlevel 1 (
  echo Installing frontend packages - this takes 1-2 minutes...
  call npm install
  if errorlevel 1 ( pause & exit /b 1 )
  copy /y "package.json" "node_modules\.package-json-installed" >nul
)

if not exist ".env.local" copy ".env.example" ".env.local" >nul

echo Frontend starting at http://localhost:3000  - keep this window open.
call npm run dev
pause
