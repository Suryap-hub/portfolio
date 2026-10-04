@echo off
rem Opens backend\.env so you can paste your Groq API key after GROQ_API_KEY=
if not exist "%~dp0backend\.env" copy "%~dp0backend\.env.example" "%~dp0backend\.env" >nul
start "" notepad "%~dp0backend\.env"
