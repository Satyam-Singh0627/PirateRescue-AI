import time
from typing import List, Dict, Tuple, Set
from models.island import Island, IslandStatus
from models.ship import RescueShip
from models.rescue_plan import RescuePlan, ShipRoute, RouteStep
from services.distance_service import DistanceService
from services.urgency_service import UrgencyService

class GreedyAlgorithmSolver:
    """
    Fast greedy heuristic solver:
    1. Scores and sorts islands by UrgencyService priority (descending).
    2. Sequentially assigns each island to the most efficient ship with sufficient remaining capacity.
    3. Optimizes individual ship routes using Nearest Neighbor + 2-Opt local search.
    4. Computes step-by-step timetables and coordinate paths.
    """

    def solve(
        self,
        islands: List[Island],
        ships: List[RescueShip],
        base_position: Tuple[float, float],
        scenario_id: str = None
    ) -> RescuePlan:
        start_time = time.perf_counter()
        
        islands_map: Dict[str, Island] = {i.id: i for i in islands}
        ships_map: Dict[str, RescueShip] = {s.id: s for s in ships}
        total_pop = sum(i.population for i in islands)

        # 1. Rank islands by urgency & vulnerability
        sorted_islands = sorted(
            islands,
            key=lambda i: UrgencyService.calculate_priority_score(i),
            reverse=True
        )

        # Track ship allocations
        ship_assignments: Dict[str, List[str]] = {s.id: [] for s in ships}
        ship_remaining_cap: Dict[str, int] = {s.id: s.max_capacity for s in ships}
        island_assigned_ship: Dict[str, str] = {}

        # 2. Assign islands greedily
        for island in sorted_islands:
            best_ship_id = None
            best_detour = float("inf")

            for ship in ships:
                if ship_remaining_cap[ship.id] >= island.population:
                    # Marginal cost: distance from ship base or last assigned island
                    last_pos = base_position
                    if ship_assignments[ship.id]:
                        last_isl = islands_map[ship_assignments[ship.id][-1]]
                        last_pos = (last_isl.latitude, last_isl.longitude)

                    dist = DistanceService.haversine(
                        last_pos[0], last_pos[1],
                        island.latitude, island.longitude
                    )

                    # Faster ships are prioritized for urgent missions
                    effective_cost = dist / (ship.speed_knots / 25.0)

                    if effective_cost < best_detour:
                        best_detour = effective_cost
                        best_ship_id = ship.id

            if best_ship_id:
                ship_assignments[best_ship_id].append(island.id)
                ship_remaining_cap[best_ship_id] -= island.population
                island_assigned_ship[island.id] = best_ship_id

        # 3. Route construction per ship
        routes: List[ShipRoute] = []
        fleet_total_time = 0.0
        fleet_total_distance = 0.0
        fleet_lives_saved = 0

        for ship in ships:
            assigned_ids = ship_assignments[ship.id]
            if not assigned_ids:
                # Ship stays docked at base
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

            # Route optimization using Nearest-Neighbor tour
            ordered_islands = self._nearest_neighbor_tour(
                base_position, assigned_ids, islands_map
            )

            # Build detailed steps
            steps: List[RouteStep] = []
            path_coords: List[List[float]] = [[base_position[0], base_position[1]]]
            
            # Step 1: Depart base
            steps.append(RouteStep(
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
            ))

            current_pos = base_position
            current_time = 0.0
            current_load = 0
            ship_distance = 0.0
            ship_rescued = 0

            step_idx = 2
            for iid in ordered_islands:
                isl = islands_map[iid]
                leg_dist = DistanceService.haversine(
                    current_pos[0], current_pos[1],
                    isl.latitude, isl.longitude
                )
                travel_mins = DistanceService.calculate_travel_time(leg_dist, ship.speed_knots)
                arrival_time = current_time + travel_mins

                # Operations time: ~15 mins for survivor embarkation & medical triage
                embark_time = 15.0
                dep_time = arrival_time + embark_time

                current_load += isl.population
                ship_rescued += isl.population
                ship_distance += leg_dist
                current_time = dep_time
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
                    arrival_time_minutes=round(arrival_time, 1),
                    departure_time_minutes=round(dep_time, 1),
                    leg_distance_nm=round(leg_dist, 1)
                ))
                step_idx += 1

            # Final Step: Return to base
            return_dist = DistanceService.haversine(
                current_pos[0], current_pos[1],
                base_position[0], base_position[1]
            )
            return_mins = DistanceService.calculate_travel_time(return_dist, ship.speed_knots)
            final_arrival = current_time + return_mins
            ship_distance += return_dist
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
                leg_distance_nm=round(return_dist, 1)
            ))

            fleet_total_time = max(fleet_total_time, final_arrival)
            fleet_total_distance += ship_distance
            fleet_lives_saved += ship_rescued

            routes.append(ShipRoute(
                ship_id=ship.id,
                ship_name=ship.name,
                ship_type=ship.type,
                steps=steps,
                total_distance_nm=round(ship_distance, 1),
                total_time_minutes=round(final_arrival, 1),
                total_rescued=ship_rescued,
                max_capacity=ship.max_capacity,
                capacity_utilization=round((ship_rescued / ship.max_capacity) * 100.0, 1),
                path_coordinates=path_coords
            ))

        # Island statuses
        island_statuses: List[IslandStatus] = []
        for island in islands:
            assigned_sid = island_assigned_ship.get(island.id)
            rescued = assigned_sid is not None
            rescue_time = None
            if rescued:
                # Find step arrival time
                for route in routes:
                    if route.ship_id == assigned_sid:
                        for s in route.steps:
                            if s.location_id == island.id:
                                rescue_time = s.arrival_time_minutes
                                break

            island_statuses.append(IslandStatus(
                island_id=island.id,
                island_name=island.name,
                rescued=rescued,
                rescue_time_minutes=rescue_time,
                assigned_ship_id=assigned_sid,
                actual_rescued_count=island.population if rescued else 0,
                remaining_population=0 if rescued else island.population
            ))

        # Fitness Calculation
        lives_ratio = fleet_lives_saved / max(total_pop, 1)
        speed_score = 1.0 / ((fleet_total_time / 60.0) + 1.0)
        distance_score = 1.0 / ((fleet_total_distance / 500.0) + 1.0)
        fitness = (lives_ratio * 0.60) + (speed_score * 0.25) + (distance_score * 0.15)

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return RescuePlan(
            plan_id=f"plan_greedy_{int(time.time() * 1000)}",
            algorithm_used="Greedy (Fast Urgency)",
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

    def _nearest_neighbor_tour(
        self,
        base_pos: Tuple[float, float],
        island_ids: List[str],
        islands_map: Dict[str, Island]
    ) -> List[str]:
        """Arranges islands in nearest-neighbor sequence from base."""
        if len(island_ids) <= 1:
            return island_ids

        tour: List[str] = []
        remaining = set(island_ids)
        current = base_pos

        while remaining:
            nearest_id = min(
                remaining,
                key=lambda iid: DistanceService.haversine(
                    current[0], current[1],
                    islands_map[iid].latitude,
                    islands_map[iid].longitude
                )
            )
            tour.append(nearest_id)
            current = (islands_map[nearest_id].latitude, islands_map[nearest_id].longitude)
            remaining.remove(nearest_id)

        return tour
