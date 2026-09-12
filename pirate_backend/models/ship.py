from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class RescueShip(BaseModel):
    id: str
    name: str
    type: str = Field(default="Cutter", description="Fast Sloop, Cutter, Medium Frigate, Heavy Transport")
    latitude: float
    longitude: float
    max_capacity: int = Field(gt=0, description="Maximum survivor boarding capacity")
    current_load: int = Field(default=0, ge=0)
    speed_knots: float = Field(default=25.0, gt=0)
    fuel_capacity: float = Field(default=1000.0, gt=0)
    current_fuel: float = Field(default=1000.0, ge=0)
    status: str = Field(default="DOCKED", description="DOCKED, IN_TRANSIT, RESCUE_OPS, RETURNING")
    assigned_islands: List[str] = Field(default_factory=list)
    departure_time: Optional[datetime] = None
    eta_return: Optional[datetime] = None

    @property
    def available_capacity(self) -> int:
        return max(0, self.max_capacity - self.current_load)

    @property
    def utilization_percent(self) -> float:
        return (self.current_load / max(self.max_capacity, 1)) * 100.0

    @property
    def fuel_percent(self) -> float:
        return (self.current_fuel / max(self.fuel_capacity, 1.0)) * 100.0
