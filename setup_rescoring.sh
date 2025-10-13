#!/bin/bash

# Setup script for Live AI Re-Scoring Feature
# This script installs the new httpx dependency required for the webhook feature

echo "=============================================="
echo "Live AI Re-Scoring Feature - Setup Script"
echo "=============================================="
echo ""

# Check if Python is installed
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Use python3 if available, otherwise python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

echo "✓ Using Python: $PYTHON_CMD"
echo ""

# Navigate to ai-service directory
cd ai-service || exit 1

echo "📦 Installing new dependency: httpx"
echo ""

# Install httpx
$PYTHON_CMD -m pip install httpx>=0.25.0

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Start AI Service:    cd ai-service && $PYTHON_CMD main.py"
    echo "2. Start Backend:       cd backend && npm run dev"
    echo "3. Start Frontend:      cd frontend && npm run dev"
    echo ""
    echo "📚 Read LIVE_AI_RESCORING_IMPLEMENTATION.md for full documentation"
else
    echo ""
    echo "❌ Installation failed. Please install manually:"
    echo "   cd ai-service"
    echo "   pip install httpx"
fi

cd ..
