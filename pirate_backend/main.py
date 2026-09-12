"""
🏴‍☠️ Pirate Island Rescue Coordinator - FastAPI Backend
Production-ready disaster rescue optimization system.
"""

import os
import sys
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

# Add current folder to sys.path so relative imports work seamlessly
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config.settings import settings
from routes.solve import router as solve_router
from routes.scenarios import router as scenarios_router
from routes.plans import router as plans_router
from routes.live import router as live_router
from middleware.error_handler import setup_error_handlers
from middleware.cors_handler import setup_cors

# Setup structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(name)s: %(message)s"
)
logger = logging.getLogger("pirate_rescue")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for initialization and cleanup."""
    logger.info("🏴‍☠️ Pirate Island Rescue Coordinator launching...")
    logger.info(f"⚓ System initialized on port {settings.PORT} | Debug: {settings.DEBUG}")
    yield
    logger.info("⚓ Lowering sails - Rescue coordinator shutting down gracefully.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Multi-objective AI optimization engine for maritime disaster rescue coordination.",
    version=settings.VERSION,
    lifespan=lifespan
)

# Setup CORS & Error handlers
setup_cors(app, settings)
setup_error_handlers(app)

# Register API Routers
app.include_router(solve_router, prefix="/api/solve", tags=["Optimization Solvers"])
app.include_router(scenarios_router, prefix="/api/scenarios", tags=["Disaster Scenarios"])
app.include_router(plans_router, prefix="/api/plans", tags=["Rescue Plans"])
app.include_router(live_router, prefix="/api/live", tags=["Real-time Simulation"])

from fastapi.responses import FileResponse
from fastapi import Request

@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint confirming engine readiness."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

@app.get("/", tags=["System"])
async def root(request: Request):
    """Root endpoint: serves Pirate React UI to browsers, and JSON info to API clients."""
    if "text/html" in request.headers.get("accept", "") and (frontend_dist / "index.html").exists():
        return FileResponse(frontend_dist / "index.html")

    return {
        "title": f"🏴‍☠️ {settings.PROJECT_NAME}",
        "docs_url": "/docs",
        "health_check": "/health",
        "endpoints": {
            "scenarios": "GET /api/scenarios",
            "solve": "POST /api/solve",
            "compare": "POST /api/solve/compare",
            "plans": "GET /api/plans",
            "live_websocket": "WS /api/live/ws"
        }
    }

# Serve frontend build if dist folder exists
frontend_dist = Path(__file__).resolve().parent.parent / "pirate_frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
