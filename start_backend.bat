@echo off
title Pirate Island Rescue - FastAPI Backend
echo 🏴‍☠️ Launching Pirate Rescue Backend on http://127.0.0.1:8000...
cd /d "%~dp0pirate_backend"
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause
