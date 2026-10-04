@echo off
title Portfolio backend (FastAPI)
cd /d "%~dp0"

if exist ".venv\Scripts\python.exe" goto have_venv

rem Find a real Python install (the Microsoft Store "python" shortcut doesn't count).
set PY=
py -3 --version >nul 2>nul
if not errorlevel 1 set PY=py -3
if not defined PY for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python3*") do if exist "%%~D\python.exe" set PY="%%~D\python.exe"
if not defined PY for /d %%D in ("C:\Python3*" "%ProgramFiles%\Python3*") do if exist "%%~D\python.exe" set PY="%%~D\python.exe"
if not defined PY for %%P in ("%USERPROFILE%\anaconda3\python.exe" "%USERPROFILE%\miniconda3\python.exe" "%ProgramData%\anaconda3\python.exe") do if exist "%%~P" set PY="%%~P"
if not defined PY (
  python --version >nul 2>nul
  if not errorlevel 1 set PY=python
)
if not defined PY (
  echo.
  echo  Python 3.11+ was not found on this PC.
  echo  Install it from https://www.python.org/downloads/
  echo  and tick "Add python.exe to PATH" in the installer, then run start.bat again.
  echo.
  pause
  exit /b 1
)

echo Using Python: %PY%
%PY% --version
echo Creating the Python virtual environment...
%PY% -m venv .venv
if errorlevel 1 ( pause & exit /b 1 )

:have_venv
call ".venv\Scripts\activate.bat"

if not exist ".venv\deps-installed.txt" (
  echo Installing backend packages - first run only, about a minute...
  python -m pip install --disable-pip-version-check -r requirements-dev.txt
  if errorlevel 1 ( pause & exit /b 1 )
  echo ok> ".venv\deps-installed.txt"
)

if not exist ".env" copy ".env.example" ".env" >nul

findstr /r /c:"^GROQ_API_KEY=..*" ".env" >nul
if errorlevel 1 (
  echo.
  echo  ============================================================
  echo   GROQ_API_KEY is empty in backend\.env
  echo   The site will load, but the chat won't answer until you
  echo   paste your key there and save. The server reloads by itself.
  echo  ============================================================
  echo.
)

echo Backend running at http://localhost:8000  - keep this window open.
python -m uvicorn app.main:app --reload --reload-include ".env" --reload-include "*.json" --port 8000
pause
