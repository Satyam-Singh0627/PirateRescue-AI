import time
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from models.rescue_plan import SolveRequest, SolveResponse, RescuePlan
from algorithms.greedy_algorithm import GreedyAlgorithmSolver
from algorithms.genetic_algorithm import GeneticAlgorithmSolver
from algorithms.hybrid_solver import HybridAlgorithmSolver

router = APIRouter()

# In-memory plan storage for recent runs
recent_plans: Dict[str, RescuePlan] = {}

@router.post("", response_model=SolveResponse)
async def solve_scenario(request: SolveRequest):
    """
    Solves disaster rescue coordination using requested algorithm:
    - 'greedy': Instantaneous urgent-first nearest-neighbor heuristic
    - 'genetic': Multi-objective evolutionary metaheuristic
    - 'hybrid': Greedy-seeded genetic search
    """
    try:
        algo = (request.algorithm or "hybrid").lower()

        if algo == "greedy":
            solver = GreedyAlgorithmSolver()
            plan = solver.solve(
                islands=request.islands,
                ships=request.ships,
                base_position=request.base_position,
                scenario_id=request.scenario_id
            )
        elif algo == "genetic":
            solver = GeneticAlgorithmSolver(
                population_size=request.population_size,
                generations=request.generations
            )
            plan = solver.solve(
                islands=request.islands,
                ships=request.ships,
                base_position=request.base_position,
                scenario_id=request.scenario_id,
                timeout_seconds=request.time_limit_seconds
            )
        else:  # hybrid
            solver = HybridAlgorithmSolver()
            plan = solver.solve(
                islands=request.islands,
                ships=request.ships,
                base_position=request.base_position,
                scenario_id=request.scenario_id,
                population_size=request.population_size,
                generations=request.generations,
                time_limit_seconds=request.time_limit_seconds
            )

        # Cache plan
        recent_plans[plan.plan_id] = plan

        return SolveResponse(
            plan=plan,
            success=True,
            message=f"Plan generated via {plan.algorithm_used} in {plan.computation_time_ms}ms"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Solver execution error: {str(e)}")


@router.post("/compare")
async def compare_algorithms(request: SolveRequest):
    """
    Runs Greedy, Genetic, and Hybrid algorithms side-by-side on the exact same scenario
    for rigorous benchmark comparison in the UI.
    """
    try:
        greedy_solver = GreedyAlgorithmSolver()
        greedy_plan = greedy_solver.solve(
            request.islands, request.ships, request.base_position, request.scenario_id
        )

        ga_solver = GeneticAlgorithmSolver(
            population_size=min(request.population_size, 150),
            generations=min(request.generations, 60)
        )
        ga_plan = ga_solver.solve(
            request.islands, request.ships, request.base_position, request.scenario_id,
            timeout_seconds=5.0
        )

        hybrid_solver = HybridAlgorithmSolver()
        hybrid_plan = hybrid_solver.solve(
            request.islands, request.ships, request.base_position, request.scenario_id,
            population_size=min(request.population_size, 150),
            generations=min(request.generations, 60),
            time_limit_seconds=5.0
        )

        recent_plans[greedy_plan.plan_id] = greedy_plan
        recent_plans[ga_plan.plan_id] = ga_plan
        recent_plans[hybrid_plan.plan_id] = hybrid_plan

        return {
            "scenario_id": request.scenario_id,
            "comparison": {
                "greedy": {
                    "algorithm": "Greedy",
                    "plan_id": greedy_plan.plan_id,
                    "computation_time_ms": greedy_plan.computation_time_ms,
                    "lives_saved": greedy_plan.total_lives_saved,
                    "rescue_rate": greedy_plan.rescue_rate_percent,
                    "total_time_mins": greedy_plan.total_mission_time_minutes,
                    "total_distance_nm": greedy_plan.total_fleet_distance_nm,
                    "fitness_score": greedy_plan.fitness_score,
                },
                "genetic": {
                    "algorithm": "Genetic Algorithm",
                    "plan_id": ga_plan.plan_id,
                    "computation_time_ms": ga_plan.computation_time_ms,
                    "lives_saved": ga_plan.total_lives_saved,
                    "rescue_rate": ga_plan.rescue_rate_percent,
                    "total_time_mins": ga_plan.total_mission_time_minutes,
                    "total_distance_nm": ga_plan.total_fleet_distance_nm,
                    "fitness_score": ga_plan.fitness_score,
                },
                "hybrid": {
                    "algorithm": "Hybrid (Greedy + GA)",
                    "plan_id": hybrid_plan.plan_id,
                    "computation_time_ms": hybrid_plan.computation_time_ms,
                    "lives_saved": hybrid_plan.total_lives_saved,
                    "rescue_rate": hybrid_plan.rescue_rate_percent,
                    "total_time_mins": hybrid_plan.total_mission_time_minutes,
                    "total_distance_nm": hybrid_plan.total_fleet_distance_nm,
                    "fitness_score": hybrid_plan.fitness_score,
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison execution error: {str(e)}")
