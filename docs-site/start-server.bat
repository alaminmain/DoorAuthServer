@echo off
echo ========================================
echo DoorAuth Documentation Site - Local Server
echo ========================================
echo.
echo Starting local server on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

cd /d "%~dp0"
python -m http.server 8000
