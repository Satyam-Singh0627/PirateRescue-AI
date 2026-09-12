import time
from typing import List, Tuple
from models.island import Island
from models.ship import RescueShip
from models.rescue_plan import RescuePlan
from .greedy_algorithm import GreedyAlgorithmSolver
from .genetic_algorithm import GeneticAlgorithmSolver

class HybridAlgorithmSolver:
    """
    Hybrid Solver:
    - Seeds generation 0 of the Genetic Algorithm with the Greedy heuristic solution.
    - Runs evolutionary optimization to further refine routes and explore combinatorial improvements.
    - Guarantees monotonic fitness (result is >= Greedy baseline).
    """

    def solve(
        self,
        islands: List[Island],
        ships: List[RescueShip],
        base_position: Tuple[float, float],
        scenario_id: str = None,
        population_size: int = 250,
        generations: int = 100,
        time_limit_seconds: float = 15.0
    ) -> RescuePlan:
        start_time = time.perf_counter()

        # Step 1: Run fast greedy solver
        greedy_solver = GreedyAlgorithmSolver()
        greedy_plan = greedy_solver.solve(islands, ships, base_position, scenario_id=scenario_id)

        # Extract ship assignment mapping from greedy plan
        greedy_assignment = {}
        for route in greedy_plan.routes:
            island_ids = [
                step.location_id for step in route.steps
                if step.action == "RESCUE"
            ]
            greedy_assignment[route.ship_id] = island_ids

        # Step 2: Seed Genetic Algorithm with greedy solution
        remaining_time = max(2.0, time_limit_seconds - (time.perf_counter() - start_time))
        ga_solver = GeneticAlgorithmSolver(
            population_size=population_size,
            generations=generations,
            mutation_rate=0.08,
            elite_fraction=0.15
        )

        ga_plan = ga_solver.solve(
            islands=islands,
            ships=ships,
            base_position=base_position,
            scenario_id=scenario_id,
            initial_seed=greedy_assignment,
            timeout_seconds=remaining_time
        )

        total_elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        # Step 3: Choose the best between Greedy and GA
        if ga_plan.fitness_score >= greedy_plan.fitness_score:
            ga_plan.algorithm_used = "Hybrid (Greedy Seed + Genetic Search)"
            ga_plan.computation_time_ms = round(total_elapsed_ms, 2)
            return ga_plan
        else:
            greedy_plan.algorithm_used = "Hybrid (Greedy Seed Preserved)"
            greedy_plan.computation_time_ms = round(total_elapsed_ms, 2)
            return greedy_plan
