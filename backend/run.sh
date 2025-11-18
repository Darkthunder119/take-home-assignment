#!/bin/bash
# Script to run the backend server

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run the server
uvicorn main:app --reload --port 8000

