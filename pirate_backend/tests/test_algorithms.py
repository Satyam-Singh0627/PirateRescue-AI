import pytest
from models.island import Island
from models.ship import RescueShip
from algorithms.greedy_algorithm import GreedyAlgorithmSolver
from algorithms.genetic_algorithm import GeneticAlgorithmSolver
from algorithms.hybrid_solver import HybridAlgorithmSolver

@pytest.fixture
def sample_data():
    islands = [
        Island(
            id="i1", name="Tortuga", latitude=20.0, longitude=-72.8,
            population=150, children_count=30, elderly_count=20, injured_count=15,
            urgency_level="CRITICAL", urgency_score=90.0, medical_needs=["Bandages"]
        ),
        Island(
            id="i2", name="Skull Cay", latitude=19.3, longitude=-74.1,
            population=80, children_count=15, elderly_count=10, injured_count=5,
            urgency_level="HIGH", urgency_score=70.0, medical_needs=["Water"]
        ),
        Island(
            id="i3", name="Dead Man Reef", latitude=18.5, longitude=-75.5,
            population=120, children_count=20, elderly_count=15, injured_count=10,
            urgency_level="MEDIUM", urgency_score=50.0
        ),
    ]
    ships = [
        RescueShip(
            id="s1", name="The Black Pearl", type="Fast Sloop",
            latitude=17.936, longitude=-76.841, max_capacity=220, speed_knots=30.0
        ),
        RescueShip(
            id="s2", name="HMS Dauntless", type="Cutter",
            latitude=17.936, longitude=-76.841, max_capacity=200, speed_knots=25.0
        ),
    ]
    base_pos = (17.936, -76.841)
    return islands, ships, base_pos


def test_greedy_solver_capacity_constraints(sample_data):
    islands, ships, base_pos = sample_data
    solver = GreedyAlgorithmSolver()
    plan = solver.solve(islands, ships, base_pos)

    assert plan.is_feasible is True
    assert plan.total_lives_saved > 0
    assert plan.total_mission_time_minutes > 0

    # Ensure no ship exceeds its max capacity
    ships_dict = {s.id: s for s in ships}
    for route in plan.routes:
        ship = ships_dict[route.ship_id]
        assert route.total_rescued <= ship.max_capacity


def test_genetic_solver_validity(sample_data):
    islands, ships, base_pos = sample_data
    solver = GeneticAlgorithmSolver(population_size=50, generations=30)
    plan = solver.solve(islands, ships, base_pos, timeout_seconds=5.0)

    assert plan.is_feasible is True
    assert plan.total_lives_saved > 0

    ships_dict = {s.id: s for s in ships}
    for route in plan.routes:
        ship = ships_dict[route.ship_id]
        assert route.total_rescued <= ship.max_capacity


def test_hybrid_solver_monotonicity(sample_data):
    islands, ships, base_pos = sample_data
    greedy = GreedyAlgorithmSolver().solve(islands, ships, base_pos)
    hybrid = HybridAlgorithmSolver().solve(
        islands, ships, base_pos, population_size=60, generations=30, time_limit_seconds=5.0
    )

    # Hybrid should be at least as good as or better than Greedy
    assert hybrid.fitness_score >= greedy.fitness_score
    assert hybrid.total_lives_saved >= greedy.total_lives_saved
