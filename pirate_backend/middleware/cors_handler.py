from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import Settings

def setup_cors(app: FastAPI, settings: Settings) -> None:
    """Configures Cross-Origin Resource Sharing."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS if "*" not in settings.CORS_ORIGINS else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
