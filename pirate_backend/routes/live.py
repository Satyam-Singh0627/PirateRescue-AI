import asyncio
import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.distance_service import DistanceService
from routes.solve import recent_plans

router = APIRouter()
logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages active real-time WebSocket clients."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket client disconnected. Active: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@router.websocket("/ws")
async def simulation_websocket(websocket: WebSocket):
    """
    Real-time simulation WebSocket endpoint.
    Clients can send:
    - { "action": "start_simulation", "plan_id": "...", "speed": 1.0 }
    - { "action": "ping" }
    The server streams tick updates with interpolated vessel coordinates,
    headings, load statuses, and island rescues.
    """
    await manager.connect(websocket)
    is_running = False

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "ping":
                await websocket.send_json({"type": "pong", "time": asyncio.get_event_loop().time()})

            elif action == "start_simulation":
                plan_id = data.get("plan_id")
                plan = recent_plans.get(plan_id)
                speed_multiplier = float(data.get("speed", 1.0))
                
                if not plan:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Plan '{plan_id}' not found in server cache"
                    })
                    continue

                await websocket.send_json({
                    "type": "simulation_started",
                    "plan_id": plan_id,
                    "total_mission_time": plan.total_mission_time_minutes
                })

                # Stream simulation ticks
                total_duration = plan.total_mission_time_minutes
                time_step = max(5.0, total_duration / 100.0)  # ~100 frames
                sim_time = 0.0
                tick_idx = 0

                while sim_time <= total_duration:
                    telemetry = _calculate_tick_state(plan, sim_time)
                    await websocket.send_json({
                        "type": "tick",
                        "tick_index": tick_idx,
                        "elapsed_minutes": round(sim_time, 1),
                        "telemetry": telemetry,
                        "is_complete": sim_time >= total_duration
                    })

                    sim_time += time_step
                    tick_idx += 1
                    # Sleep proportional to speed
                    sleep_s = max(0.02, 0.1 / max(speed_multiplier, 0.1))
                    await asyncio.sleep(sleep_s)

                await websocket.send_json({
                    "type": "simulation_completed",
                    "plan_id": plan_id,
                    "total_lives_saved": plan.total_lives_saved
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


def _calculate_tick_state(plan: Any, current_time: float) -> Dict[str, Any]:
    """Computes exact positions, bearings, and survivor pickups at current_time."""
    ships_state = []
    rescued_islands = set()
    total_saved = 0

    for route in plan.routes:
        steps = route.steps
        if not steps or len(steps) < 2:
            continue

        # Find which segment the ship is on
        lat = steps[0].latitude
        lon = steps[0].longitude
        bearing = 0.0
        ship_status = "DOCKED"
        current_load = 0
        target_name = steps[0].location_name

        if current_time <= steps[0].departure_time_minutes:
            lat = steps[0].latitude
            lon = steps[0].longitude
            ship_status = "PREPARING"
            bearing = 0.0
        elif current_time >= steps[-1].arrival_time_minutes:
            lat = steps[-1].latitude
            lon = steps[-1].longitude
            ship_status = "MISSION_COMPLETE"
            current_load = steps[-1].cumulative_load
            bearing = 0.0
        else:
            for idx in range(len(steps) - 1):
                s1 = steps[idx]
                s2 = steps[idx + 1]

                # If inside embarkation window at s1
                if s1.arrival_time_minutes <= current_time <= s1.departure_time_minutes:
                    lat = s1.latitude
                    lon = s1.longitude
                    current_load = s1.cumulative_load
                    ship_status = "RESCUING" if s1.action == "RESCUE" else "DOCKED"
                    target_name = s1.location_name
                    if s1.action == "RESCUE":
                        rescued_islands.add(s1.location_id)
                    break

                # If in transit from s1 to s2
                if s1.departure_time_minutes <= current_time <= s2.arrival_time_minutes:
                    seg_duration = max(0.1, s2.arrival_time_minutes - s1.departure_time_minutes)
                    fraction = (current_time - s1.departure_time_minutes) / seg_duration
                    lat, lon = DistanceService.interpolate_position(
                        s1.latitude, s1.longitude, s2.latitude, s2.longitude, fraction
                    )
                    bearing = DistanceService.calculate_bearing(
                        s1.latitude, s1.longitude, s2.latitude, s2.longitude
                    )
                    current_load = s1.cumulative_load
                    ship_status = "IN_TRANSIT"
                    target_name = s2.location_name
                    break

        total_saved += current_load
        ships_state.append({
            "ship_id": route.ship_id,
            "ship_name": route.ship_name,
            "latitude": round(lat, 4),
            "longitude": round(lon, 4),
            "bearing": round(bearing, 1),
            "status": ship_status,
            "target": target_name,
            "current_load": current_load,
            "max_capacity": route.max_capacity,
            "utilization": round((current_load / max(route.max_capacity, 1)) * 100.0, 1)
        })

    islands_state = []
    for isl in plan.island_statuses:
        is_rescued = (isl.island_id in rescued_islands) or (
            isl.rescue_time_minutes is not None and current_time >= isl.rescue_time_minutes
        )
        islands_state.append({
            "island_id": isl.island_id,
            "island_name": isl.island_name,
            "rescued": is_rescued,
            "saved_count": isl.actual_rescued_count if is_rescued else 0,
            "remaining": 0 if is_rescued else isl.remaining_population
        })

    return {
        "ships": ships_state,
        "islands": islands_state,
        "total_lives_saved": total_saved
    }
