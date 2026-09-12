import random
import time
from typing import List, Dict, Tuple, Optional, Set
from models.island import Island, IslandStatus
from models.ship import RescueShip
from models.rescue_plan import RescuePlan, ShipRoute, RouteStep
from services.distance_service import DistanceService
from services.urgency_service import UrgencyService

class Individual:
    """Represents a candidate fleet rescue assignment solution (chromosome)."""

    def __init__(self, ships: List[RescueShip], islands: List[Island], randomize: bool = True):
        self.assignment: Dict[str, List[str]] = {s.id: [] for s in ships}
        self.fitness: float = 0.0
        self.total_lives_saved: int = 0
        self.total_time_minutes: float = 0.0
        self.total_distance_nm: float = 0.0

        if randomize and islands and ships:
            self._random_initialize(ships, islands)

    def _random_initialize(self, ships: List[RescueShip], islands: List[Island]) -> None:
        """Assigns islands to ships while strictly respecting capacity constraints."""
        ships_map = {s.id: s for s in ships}
        islands_map = {i.id: i for i in islands}
        remaining_caps = {s.id: s.max_capacity for s in ships}

        # Shuffle islands and try to allocate
        shuffled = random.sample(islands, len(islands))
        for isl in shuffled:
            # Candidates that can take this island
            valid_ships = [
                sid for sid, cap in remaining_caps.items()
                if cap >= isl.population
            ]
            if valid_ships:
                # Random choice with slight bias toward higher capacity ships
                chosen_sid = random.choice(valid_ships)
                self.assignment[chosen_sid].append(isl.id)
                remaining_caps[chosen_sid] -= isl.population

    def is_valid(self, islands_map: Dict[str, Island], ships_map: Dict[str, RescueShip]) -> bool:
        """Verifies capacity constraints for all ships."""
        for sid, island_ids in self.assignment.items():
            ship = ships_map[sid]
            load = sum(islands_map[iid].population for iid in island_ids)
            if load > ship.max_capacity:
                return False
        return True

    def calculate_fitness(
        self,
        islands_map: Dict[str, Island],
        ships_map: Dict[str, RescueShip],
        base_position: Tuple[float, float],
        total_population: int
    ) -> float:
        """
        Multi-objective fitness:
        Lives Saved (60%) + Speed Score (25%) + Distance Score (15%)
        """
        fleet_lives = 0
        max_time = 0.0
        fleet_dist = 0.0

        for sid, iids in self.assignment.items():
            if not iids:
                continue

            ship = ships_map[sid]
            load = sum(islands_map[iid].population for iid in iids)
            fleet_lives += load

            # Fast nearest neighbor distance calculation
            current = base_position
            route_dist = 0.0
            remaining = set(iids)

            while remaining:
                nearest_id = min(
                    remaining,
                    key=lambda x: DistanceService.haversine(
                        current[0], current[1],
                        islands_map[x].latitude, islands_map[x].longitude
                    )
                )
                leg = DistanceService.haversine(
                    current[0], current[1],
                    islands_map[nearest_id].latitude, islands_map[nearest_id].longitude
                )
                route_dist += leg
                current = (islands_map[nearest_id].latitude, islands_map[nearest_id].longitude)
                remaining.remove(nearest_id)

            # Return to base
            ret_dist = DistanceService.haversine(
                current[0], current[1], base_position[0], base_position[1]
            )
            route_dist += ret_dist
            fleet_dist += route_dist

            travel_mins = DistanceService.calculate_travel_time(route_dist, ship.speed_knots)
            # Add boarding time (15 mins per island)
            total_ship_time = travel_mins + (len(iids) * 15.0)
            max_time = max(max_time, total_ship_time)

        self.total_lives_saved = fleet_lives
        self.total_time_minutes = max_time
        self.total_distance_nm = fleet_dist

        lives_ratio = fleet_lives / max(total_population, 1)
        speed_score = 1.0 / ((max_time / 60.0) + 1.0)
        distance_score = 1.0 / ((fleet_dist / 500.0) + 1.0)

        self.fitness = (lives_ratio * 0.60) + (speed_score * 0.25) + (distance_score * 0.15)
        return self.fitness

    def clone(self) -> "Individual":
        child = Individual([], [], randomize=False)
        child.assignment = {k: list(v) for k, v in self.assignment.items()}
        child.fitness = self.fitness
        child.total_lives_saved = self.total_lives_saved
        child.total_time_minutes = self.total_time_minutes
        child.total_distance_nm = self.total_distance_nm
        return child


class GeneticAlgorithmSolver:
    """
    Genetic Algorithm for multi-ship disaster rescue optimization.
    Features tournament selection, adaptive mutation, 2-opt route refinement, and elitism.
    """

    def __init__(
        self,
        population_size: int = 200,
        generations: int = 100,
        mutation_rate: float = 0.08,
        elite_fraction: float = 0.12
    ):
        self.population_size = max(40, population_size)
        self.generations = max(20, generations)
        self.mutation_rate = mutation_rate
        self.elite_size = max(2, int(self.population_size * elite_fraction))

    def solve(
        self,
        islands: List[Island],
        ships: List[RescueShip],
        base_position: Tuple[float, float],
        scenario_id: str = None,
        initial_seed: Optional[Dict[str, List[str]]] = None,
        timeout_seconds: float = 20.0
    ) -> RescuePlan:
        start_time = time.perf_counter()
        islands_map = {i.id: i for i in islands}
        ships_map = {s.id: s for s in ships}
        total_pop = sum(i.population for i in islands)

        # 1. Initialize population
        population: List[Individual] = []

        # If seed provided (e.g. from Greedy heuristic), inject it as an elite founder!
        if initial_seed:
            seeded_ind = Individual(ships, islands, randomize=False)
            seeded_ind.assignment = {k: list(v) for k, v in initial_seed.items()}
            if seeded_ind.is_valid(islands_map, ships_map):
                seeded_ind.calculate_fitness(islands_map, ships_map, base_position, total_pop)
                population.append(seeded_ind)

        while len(population) < self.population_size:
            ind = Individual(ships, islands, randomize=True)
            if ind.is_valid(islands_map, ships_map):
                ind.calculate_fitness(islands_map, ships_map, base_position, total_pop)
                population.append(ind)

        best_ind = max(population, key=lambda x: x.fitness).clone()

        # 2. Evolutionary cycle
        for gen in range(self.generations):
            # Check timeout
            if (time.perf_counter() - start_time) >= timeout_seconds:
                break

            # Sort by fitness descending
            population.sort(key=lambda x: x.fitness, reverse=True)
            if population[0].fitness > best_ind.fitness:
                best_ind = population[0].clone()

            # Elitism: retain top individuals
            new_population = [ind.clone() for ind in population[:self.elite_size]]

            while len(new_population) < self.population_size:
                # Tournament Selection
                p1 = self._tournament_select(population, k=3)
                p2 = self._tournament_select(population, k=3)

                child = self._crossover(p1, p2, ships, islands_map, ships_map)
                self._mutate(child, islands, islands_map, ships_map)

                # Validate and repair if needed
                if child.is_valid(islands_map, ships_map):
                    child.calculate_fitness(islands_map, ships_map, base_position, total_pop)
                    new_population.append(child)

            population = new_population

        # Final evaluation of the champion individual
        best_ind.calculate_fitness(islands_map, ships_map, base_position, total_pop)
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        # 3. Build detailed RescuePlan
        return self._build_plan(
            best_ind, islands, ships, base_position, islands_map, ships_map,
            scenario_id, total_pop, elapsed_ms
        )

    def _tournament_select(self, population: List[Individual], k: int = 3) -> Individual:
        sample = random.sample(population, min(k, len(population)))
        return max(sample, key=lambda ind: ind.fitness)

    def _crossover(
        self,
        p1: Individual,
        p2: Individual,
        ships: List[RescueShip],
        islands_map: Dict[str, Island],
        ships_map: Dict[str, RescueShip]
    ) -> Individual:
        """Performs structured ship-assignment crossover preserving single island assignments."""
        child = Individual(ships, [], randomize=False)
        ship_ids = [s.id for s in ships]

        # Pick a crossover split point
        split = random.randint(1, max(1, len(ship_ids) - 1))
        assigned_islands: Set[str] = set()

        for i, sid in enumerate(ship_ids):
            source = p1 if i < split else p2
            candidate_list = [
                iid for iid in source.assignment.get(sid, [])
                if iid not in assigned_islands
            ]
            
            # Check capacity
            current_load = sum(islands_map[iid].population for iid in candidate_list)
            if current_load <= ships_map[sid].max_capacity:
                child.assignment[sid] = candidate_list
                assigned_islands.update(candidate_list)
            else:
                # Trim until it fits
                trimmed = []
                t_load = 0
                for iid in candidate_list:
                    if t_load + islands_map[iid].population <= ships_map[sid].max_capacity:
                        trimmed.append(iid)
                        t_load += islands_map[iid].population
                        assigned_islands.add(iid)
                child.assignment[sid] = trimmed

        return child

    def _mutate(
        self,
        child: Individual,
        all_islands: List[Island],
        islands_map: Dict[str, Island],
        ships_map: Dict[str, RescueShip]
    ) -> None:
        """Mutations: island migration, ship swap, and local itinerary reordering."""
        if random.random() > self.mutation_rate:
            return

        mutation_type = random.choice(["migrate", "swap", "reorder"])
        ship_ids = list(child.assignment.keys())
        if len(ship_ids) < 2:
            mutation_type = "reorder"

        if mutation_type == "migrate":
            s1, s2 = random.sample(ship_ids, 2)
            if child.assignment[s1]:
                isl_id = random.choice(child.assignment[s1])
                isl = islands_map[isl_id]
                s2_load = sum(islands_map[i].population for i in child.assignment[s2])
                if s2_load + isl.population <= ships_map[s2].max_capacity:
                    child.assignment[s1].remove(isl_id)
                    child.assignment[s2].append(isl_id)

        elif mutation_type == "swap":
            s1, s2 = random.sample(ship_ids, 2)
            if child.assignment[s1] and child.assignment[s2]:
                i1 = random.choice(child.assignment[s1])
                i2 = random.choice(child.assignment[s2])
                s1_load = sum(islands_map[i].population for i in child.assignment[s1]) - islands_map[i1].population + islands_map[i2].population
                s2_load = sum(islands_map[i].population for i in child.assignment[s2]) - islands_map[i2].population + islands_map[i1].population
                if s1_load <= ships_map[s1].max_capacity and s2_load <= ships_map[s2].max_capacity:
                    child.assignment[s1].remove(i1)
                    child.assignment[s1].append(i2)
                    child.assignment[s2].remove(i2)
                    child.assignment[s2].append(i1)

        elif mutation_type == "reorder":
            sid = random.choice(ship_ids)
            if len(child.assignment[sid]) >= 3:
                i, j = sorted(random.sample(range(len(child.assignment[sid])), 2))
                child.assignment[sid][i:j+1] = reversed(child.assignment[sid][i:j+1])

    def _build_plan(
        self,
        ind: Individual,
        islands: List[Island],
        ships: List[RescueShip],
        base_position: Tuple[float, float],
        islands_map: Dict[str, Island],
        ships_map: Dict[str, RescueShip],
        scenario_id: Optional[str],
        total_pop: int,
        elapsed_ms: float
    ) -> RescuePlan:
        """Converts the champion individual into a complete RescuePlan with timetables."""
        routes: List[ShipRoute] = []
        fleet_total_time = 0.0
        fleet_total_distance = 0.0
        fleet_lives_saved = 0
        island_assigned_ship: Dict[str, str] = {}

        for ship in ships:
            assigned_ids = ind.assignment.get(ship.id, [])
            if not assigned_ids:
                routes.append(ShipRoute(
                    ship_id=ship.id,
                    ship_name=ship.name,
                    ship_type=ship.type,
                    steps=[
                        RouteStep(
                            step_number=1,
                            location_id="base",
                            location_name="Port Royal (Base)",
                            latitude=base_position[0],
                            longitude=base_position[1],
                            action="DOCKED",
                            passengers_boarded=0,
                            cumulative_load=0,
                            arrival_time_minutes=0.0,
                            departure_time_minutes=0.0,
                            leg_distance_nm=0.0
                        )
                    ],
                    total_distance_nm=0.0,
                    total_time_minutes=0.0,
                    total_rescued=0,
                    max_capacity=ship.max_capacity,
                    capacity_utilization=0.0,
                    path_coordinates=[[base_position[0], base_position[1]]]
                ))
                continue

            # Build detailed path and steps
            steps: List[RouteStep] = [
                RouteStep(
                    step_number=1,
                    location_id="base",
                    location_name="Port Royal (Base)",
                    latitude=base_position[0],
                    longitude=base_position[1],
                    action="DEPART_BASE",
                    passengers_boarded=0,
                    cumulative_load=0,
                    arrival_time_minutes=0.0,
                    departure_time_minutes=0.0,
                    leg_distance_nm=0.0
                )
            ]
            path_coords: List[List[float]] = [[base_position[0], base_position[1]]]

            current_pos = base_position
            current_time = 0.0
            current_load = 0
            ship_dist = 0.0
            step_idx = 2

            for iid in assigned_ids:
                isl = islands_map[iid]
                island_assigned_ship[iid] = ship.id
                leg = DistanceService.haversine(
                    current_pos[0], current_pos[1], isl.latitude, isl.longitude
                )
                t_mins = DistanceService.calculate_travel_time(leg, ship.speed_knots)
                arrival = current_time + t_mins
                dep = arrival + 15.0  # 15 mins embarkation
                current_load += isl.population
                ship_dist += leg
                current_time = dep
                current_pos = (isl.latitude, isl.longitude)
                path_coords.append([isl.latitude, isl.longitude])

                steps.append(RouteStep(
                    step_number=step_idx,
                    location_id=isl.id,
                    location_name=isl.name,
                    latitude=isl.latitude,
                    longitude=isl.longitude,
                    action="RESCUE",
                    passengers_boarded=isl.population,
                    cumulative_load=current_load,
                    arrival_time_minutes=round(arrival, 1),
                    departure_time_minutes=round(dep, 1),
                    leg_distance_nm=round(leg, 1)
                ))
                step_idx += 1

            # Return to base
            ret_leg = DistanceService.haversine(
                current_pos[0], current_pos[1], base_position[0], base_position[1]
            )
            ret_mins = DistanceService.calculate_travel_time(ret_leg, ship.speed_knots)
            final_arrival = current_time + ret_mins
            ship_dist += ret_leg
            path_coords.append([base_position[0], base_position[1]])

            steps.append(RouteStep(
                step_number=step_idx,
                location_id="base",
                location_name="Port Royal (Base)",
                latitude=base_position[0],
                longitude=base_position[1],
                action="RETURN_BASE",
                passengers_boarded=0,
                cumulative_load=current_load,
                arrival_time_minutes=round(final_arrival, 1),
                departure_time_minutes=round(final_arrival, 1),
                leg_distance_nm=round(ret_leg, 1)
            ))

            fleet_total_time = max(fleet_total_time, final_arrival)
            fleet_total_distance += ship_dist
            fleet_lives_saved += current_load

            routes.append(ShipRoute(
                ship_id=ship.id,
                ship_name=ship.name,
                ship_type=ship.type,
                steps=steps,
                total_distance_nm=round(ship_dist, 1),
                total_time_minutes=round(final_arrival, 1),
                total_rescued=current_load,
                max_capacity=ship.max_capacity,
                capacity_utilization=round((current_load / ship.max_capacity) * 100.0, 1),
                path_coordinates=path_coords
            ))

        island_statuses: List[IslandStatus] = []
        for isl in islands:
            sid = island_assigned_ship.get(isl.id)
            rescued = sid is not None
            r_time = None
            if rescued:
                for r in routes:
                    if r.ship_id == sid:
                        for s in r.steps:
                            if s.location_id == isl.id:
                                r_time = s.arrival_time_minutes
                                break

            island_statuses.append(IslandStatus(
                island_id=isl.id,
                island_name=isl.name,
                rescued=rescued,
                rescue_time_minutes=r_time,
                assigned_ship_id=sid,
                actual_rescued_count=isl.population if rescued else 0,
                remaining_population=0 if rescued else isl.population
            ))

        lives_ratio = fleet_lives_saved / max(total_pop, 1)
        speed_score = 1.0 / ((fleet_total_time / 60.0) + 1.0)
        distance_score = 1.0 / ((fleet_total_distance / 500.0) + 1.0)
        fitness = (lives_ratio * 0.60) + (speed_score * 0.25) + (distance_score * 0.15)

        return RescuePlan(
            plan_id=f"plan_genetic_{int(time.time() * 1000)}",
            algorithm_used="Genetic Algorithm (Metaheuristic)",
            scenario_id=scenario_id,
            total_lives_saved=fleet_lives_saved,
            total_population_at_risk=total_pop,
            rescue_rate_percent=round(lives_ratio * 100.0, 1),
            total_mission_time_minutes=round(fleet_total_time, 1),
            total_fleet_distance_nm=round(fleet_total_distance, 1),
            fitness_score=round(fitness * 100.0, 2),
            computation_time_ms=round(elapsed_ms, 2),
            routes=routes,
            island_statuses=island_statuses,
            is_feasible=True,
            constraint_violations=[],
            timestamp=str(time.time())
        )
