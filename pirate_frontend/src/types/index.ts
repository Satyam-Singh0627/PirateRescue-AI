export interface Island {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  population: number;
  children_count: number;
  elderly_count: number;
  injured_count: number;
  urgency_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  urgency_score: number;
  medical_needs: string[];
  hazard_level?: number;
}

export interface RescueShip {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  max_capacity: number;
  current_load?: number;
  speed_knots: number;
  fuel_capacity: number;
  current_fuel: number;
  status: 'DOCKED' | 'IN_TRANSIT' | 'RESCUE_OPS' | 'RETURNING';
}

export interface RouteStep {
  step_number: number;
  location_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  action: string;
  passengers_boarded: number;
  cumulative_load: number;
  arrival_time_minutes: number;
  departure_time_minutes: number;
  leg_distance_nm: number;
}

export interface ShipRoute {
  ship_id: string;
  ship_name: string;
  ship_type: string;
  steps: RouteStep[];
  total_distance_nm: number;
  total_time_minutes: number;
  total_rescued: number;
  max_capacity: number;
  capacity_utilization: number;
  path_coordinates: [number, number][];
}

export interface IslandStatus {
  island_id: string;
  island_name: string;
  rescued: boolean;
  rescue_time_minutes: number | null;
  assigned_ship_id: string | null;
  actual_rescued_count: number;
  remaining_population: number;
}

export interface RescuePlan {
  plan_id: string;
  algorithm_used: string;
  scenario_id?: string;
  total_lives_saved: number;
  total_population_at_risk: number;
  rescue_rate_percent: number;
  total_mission_time_minutes: number;
  total_fleet_distance_nm: number;
  fitness_score: number;
  computation_time_ms: number;
  routes: ShipRoute[];
  island_statuses: IslandStatus[];
  is_feasible: boolean;
  timestamp: string;
}

export interface Scenario {
  id: string;
  name: string;
  difficulty: string;
  description: string;
  islands_count: number;
  ships_count: number;
  total_population: number;
  total_fleet_capacity: number;
  islands: Island[];
  ships: RescueShip[];
}

export interface BasePort {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
}

export interface AlgorithmBenchmark {
  algorithm: string;
  plan_id: string;
  computation_time_ms: number;
  lives_saved: number;
  rescue_rate: number;
  total_time_mins: number;
  total_distance_nm: number;
  fitness_score: number;
}
