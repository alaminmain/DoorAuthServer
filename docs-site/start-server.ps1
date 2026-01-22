#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DoorAuth Documentation Site - Local Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting local server on http://localhost:8000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Check if Python is available
if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "Using Python HTTP Server..." -ForegroundColor Green
    python -m http.server 8000
}
# Check if Node.js is available
elseif (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "Python not found. Using Node.js HTTP Server..." -ForegroundColor Yellow
    npx -y http-server -p 8000
}
else {
    Write-Host "ERROR: Neither Python nor Node.js found!" -ForegroundColor Red
    Write-Host "Please install Python or Node.js to run the local server." -ForegroundColor Red
    Write-Host ""
    Write-Host "Download Python: https://www.python.org/downloads/" -ForegroundColor Cyan
    Write-Host "Download Node.js: https://nodejs.org/" -ForegroundColor Cyan
    pause
}
