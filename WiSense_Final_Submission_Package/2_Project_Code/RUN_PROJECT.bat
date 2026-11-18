@echo off
title WiSense - M.Tech Research Project Live Engine
color 0B
cls

echo =====================================================================
echo          WiSense: Wi-Fi Sensing ^& Contactless Perception
echo             M.Tech Dissertation ^& Technical Research Demonstration
echo =====================================================================
echo.
echo [*] Checking Python environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH! Please install Python.
    pause
    exit /b
)

echo [*] Starting WiSense Live Deep Sensing Server...
echo [*] Web Dashboard will launch at: http://localhost:5000/
echo.

cd /d "%~dp0backend"

:: Launch default web browser after 2 seconds
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5000/"

:: Run the backend server
python app.py

pause
