from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Island(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    population: int = Field(gt=0, description="Total stranded population")
    children_count: int = Field(default=0, ge=0)
    elderly_count: int = Field(default=0, ge=0)
    injured_count: int = Field(default=0, ge=0)
    urgency_level: str = Field(default="MEDIUM", description="CRITICAL, HIGH, MEDIUM, LOW")
    urgency_score: float = Field(default=50.0, ge=0.0, le=100.0)
    medical_needs: List[str] = Field(default_factory=list)
    hazard_level: float = Field(default=1.0, ge=0.5, le=5.0)
    last_update: Optional[datetime] = None

    @property
    def vulnerable_population(self) -> int:
        return self.children_count + self.elderly_count + self.injured_count

    @property
    def vulnerable_ratio(self) -> float:
        return self.vulnerable_population / max(self.population, 1)

class IslandStatus(BaseModel):
    island_id: str
    island_name: str
    rescued: bool = False
    rescue_time_minutes: Optional[float] = None
    assigned_ship_id: Optional[str] = None
    actual_rescued_count: int = 0
    remaining_population: int = 0
