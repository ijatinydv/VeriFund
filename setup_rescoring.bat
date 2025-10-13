@echo off
REM Setup script for Live AI Re-Scoring Feature (Windows)
REM This script installs the new httpx dependency required for the webhook feature

echo ==============================================
echo Live AI Re-Scoring Feature - Setup Script
echo ==============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo X Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

echo OK Using Python
echo.

REM Navigate to ai-service directory
cd ai-service
if %errorlevel% neq 0 (
    echo X Failed to navigate to ai-service directory
    pause
    exit /b 1
)

echo Installing new dependency: httpx
echo.

REM Install httpx
python -m pip install httpx>=0.25.0

if %errorlevel% equ 0 (
    echo.
    echo OK Setup complete!
    echo.
    echo Next steps:
    echo 1. Start AI Service:    cd ai-service ^&^& python main.py
    echo 2. Start Backend:       cd backend ^&^& npm run dev
    echo 3. Start Frontend:      cd frontend ^&^& npm run dev
    echo.
    echo Read LIVE_AI_RESCORING_IMPLEMENTATION.md for full documentation
) else (
    echo.
    echo X Installation failed. Please install manually:
    echo    cd ai-service
    echo    pip install httpx
)

cd ..
pause
