from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Tuple, Any
from .island import Island, IslandStatus
from .ship import RescueShip

class RouteStep(BaseModel):
    step_number: int
    location_id: str
    location_name: str
    latitude: float
    longitude: float
    action: str = Field(description="DEPART_BASE, RESCUE, RETURN_BASE")
    passengers_boarded: int = 0
    cumulative_load: int = 0
    arrival_time_minutes: float = 0.0
    departure_time_minutes: float = 0.0
    leg_distance_nm: float = 0.0

class ShipRoute(BaseModel):
    ship_id: str
    ship_name: str
    ship_type: str
    steps: List[RouteStep] = Field(default_factory=list)
    total_distance_nm: float = 0.0
    total_time_minutes: float = 0.0
    total_rescued: int = 0
    max_capacity: int = 0
    capacity_utilization: float = 0.0
    path_coordinates: List[List[float]] = Field(
        default_factory=list,
        description="List of [latitude, longitude] pairs for polyline rendering"
    )

class RescuePlan(BaseModel):
    plan_id: str
    algorithm_used: str
    scenario_id: Optional[str] = None
    total_lives_saved: int
    total_population_at_risk: int
    rescue_rate_percent: float
    total_mission_time_minutes: float
    total_fleet_distance_nm: float
    fitness_score: float
    computation_time_ms: float
    routes: List[ShipRoute] = Field(default_factory=list)
    island_statuses: List[IslandStatus] = Field(default_factory=list)
    is_feasible: bool = True
    constraint_violations: List[str] = Field(default_factory=list)
    timestamp: str

class SolveRequest(BaseModel):
    scenario_id: Optional[str] = None
    islands: List[Island]
    ships: List[RescueShip]
    base_position: Tuple[float, float] = (17.936, -76.841)
    algorithm: str = Field(default="hybrid", description="greedy, genetic, hybrid")
    time_limit_seconds: float = Field(default=15.0, ge=1.0, le=60.0)
    generations: int = Field(default=120, ge=10, le=500)
    population_size: int = Field(default=250, ge=50, le=1000)

class SolveResponse(BaseModel):
    plan: RescuePlan
    success: bool = True
    message: str = "Optimization completed successfully"

class SimulationTick(BaseModel):
    tick_index: int
    elapsed_minutes: float
    ships_telemetry: List[Dict[str, Any]]
    islands_telemetry: List[Dict[str, Any]]
    total_lives_saved: int
    is_complete: bool
