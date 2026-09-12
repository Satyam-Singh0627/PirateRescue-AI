from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from services.scenario_service import scenario_service

router = APIRouter()

@router.get("", response_model=List[Dict[str, Any]])
async def list_scenarios():
    """Returns all available standardized and custom Caribbean disaster scenarios."""
    return scenario_service.get_all_scenarios()

@router.get("/base/port", response_model=Dict[str, Any])
async def get_base_port():
    """Returns the headquarters base port coordinates (Port Royal)."""
    return scenario_service.get_base_port()

@router.get("/{scenario_id}", response_model=Dict[str, Any])
async def get_scenario(scenario_id: str):
    """Fetches details for a specific scenario by ID."""
    sc = scenario_service.get_scenario_by_id(scenario_id)
    if not sc:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")
    return sc

@router.post("", response_model=Dict[str, Any], status_code=201)
async def create_custom_scenario(payload: Dict[str, Any]):
    """Registers a new user-defined disaster scenario."""
    try:
        return scenario_service.add_custom_scenario(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid scenario payload: {str(e)}")
