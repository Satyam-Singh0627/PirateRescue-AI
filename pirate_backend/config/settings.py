from pydantic import BaseModel, Field
from typing import List
import os
from pathlib import Path

class Settings(BaseModel):
    PROJECT_NAME: str = "Pirate Island Rescue Coordinator"
    VERSION: str = "1.0.0"
    DEBUG: bool = Field(default_factory=lambda: os.getenv("DEBUG", "true").lower() == "true")
    ENVIRONMENT: str = Field(default_factory=lambda: os.getenv("ENVIRONMENT", "development"))
    HOST: str = Field(default_factory=lambda: os.getenv("HOST", "0.0.0.0"))
    PORT: int = Field(default_factory=lambda: int(os.getenv("PORT", "8000")))
    CORS_ORIGINS: List[str] = ["*"]

    # Base directory paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    DEFAULT_SCENARIOS_PATH: Path = DATA_DIR / "standardized_scenarios.json"

    # Algorithm default parameters
    DEFAULT_GENERATIONS: int = 120
    DEFAULT_POPULATION_SIZE: int = 250
    DEFAULT_MUTATION_RATE: float = 0.08
    DEFAULT_ELITE_FRACTION: float = 0.12

settings = Settings()
