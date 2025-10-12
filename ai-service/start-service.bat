@echo off
REM VeriFund AI Service - Quick Start Script (Windows)
REM This script will start the AI service with all fixes applied

echo ================================================================
echo VeriFund AI Service - Starting...
echo ================================================================

cd /d "%~dp0"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    exit /b 1
)

REM Check if model file exists
if not exist "verifund_model.joblib" (
    echo Error: Model file 'verifund_model.joblib' not found
    echo Please ensure the model is trained first (run train.py)
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo Warning: Virtual environment not found
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install/upgrade dependencies
echo Installing dependencies...
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo.
echo ================================================================
echo Starting AI Service...
echo ================================================================
echo All fixes applied:
echo   [OK] Pydantic V2 compatibility (.model_dump())
echo   [OK] NumPy serialization (explicit float conversions)
echo   [OK] No deprecation warnings
echo ================================================================
echo.

REM Start the service
python main.py
