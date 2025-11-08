#!/bin/bash

# ReActure - Quick Start Script
echo "🚀 Starting ReActure..."
echo ""
echo "Make sure you're in the ReActure directory!"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Starting server with Python 3..."
    echo "📡 Server will be available at: http://localhost:8000"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ Starting server with Python..."
    echo "📡 Server will be available at: http://localhost:8000"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    python -m http.server 8000
else
    echo "❌ Python not found. Please install Python 3 or use Node.js:"
    echo "   npx http-server -p 8000"
    exit 1
fi

