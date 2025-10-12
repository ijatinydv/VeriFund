#!/bin/bash

# VeriFund AI Service - Quick Start Script
# This script will start the AI service with all fixes applied

echo "================================================================"
echo "VeriFund AI Service - Starting..."
echo "================================================================"

# Navigate to AI service directory
cd "$(dirname "$0")"

# Check if Python is available
if ! command -v python &> /dev/null; then
    echo "Error: Python is not installed or not in PATH"
    exit 1
fi

# Check if required files exist
if [ ! -f "verifund_model.joblib" ]; then
    echo "Error: Model file 'verifund_model.joblib' not found"
    echo "Please ensure the model is trained first (run train.py)"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Warning: Virtual environment not found"
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment (Windows Git Bash)
if [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install/upgrade dependencies
echo "Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo ""
echo "================================================================"
echo "Starting AI Service..."
echo "================================================================"
echo "All fixes applied:"
echo "  ✓ Pydantic V2 compatibility (.model_dump())"
echo "  ✓ NumPy serialization (explicit float conversions)"
echo "  ✓ No deprecation warnings"
echo "================================================================"
echo ""

# Start the service
python main.py
