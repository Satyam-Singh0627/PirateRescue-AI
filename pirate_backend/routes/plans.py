from fastapi import APIRouter, HTTPException
from typing import List, Optional
from models.rescue_plan import RescuePlan
from routes.solve import recent_plans

router = APIRouter()

@router.get("", response_model=List[RescuePlan])
async def list_recent_plans():
    """Lists recent solved plans."""
    return list(recent_plans.values())

@router.get("/{plan_id}", response_model=RescuePlan)
async def get_plan(plan_id: str):
    """Retrieves a specific plan by ID."""
    if plan_id not in recent_plans:
        raise HTTPException(status_code=404, detail=f"Plan '{plan_id}' not found")
    return recent_plans[plan_id]
