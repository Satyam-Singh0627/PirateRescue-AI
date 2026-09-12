import json
import logging
from pathlib import Path
from typing import List, Dict, Optional, Any
from config.settings import settings
from models.island import Island
from models.ship import RescueShip

logger = logging.getLogger(__name__)

class ScenarioService:
    """Manages disaster scenario datasets, validation, and dynamic scenario storage."""

    def __init__(self, data_path: Optional[Path] = None):
        self.data_path = data_path or settings.DEFAULT_SCENARIOS_PATH
        self._cache: Dict[str, Any] = {}
        self._custom_scenarios: Dict[str, Dict[str, Any]] = {}
        self.load_scenarios()

    def load_scenarios(self) -> None:
        """Loads and parses scenario dataset from JSON."""
        try:
            if self.data_path.exists():
                with open(self.data_path, "r", encoding="utf-8") as f:
                    self._cache = json.load(f)
                logger.info(f"Loaded scenarios from {self.data_path}")
            else:
                logger.warning(f"Scenario dataset not found at {self.data_path}")
                self._cache = {"base_port": {"id": "port_royal", "name": "Port Royal", "latitude": 17.936, "longitude": -76.841}, "scenarios": []}
        except Exception as e:
            logger.error(f"Failed to load scenarios: {e}")
            self._cache = {"base_port": {"id": "port_royal", "name": "Port Royal", "latitude": 17.936, "longitude": -76.841}, "scenarios": []}

    def get_base_port(self) -> Dict[str, Any]:
        """Returns standard fleet base coordinates."""
        return self._cache.get("base_port", {
            "id": "port_royal",
            "name": "Port Royal Stronghold",
            "latitude": 17.936,
            "longitude": -76.841
        })

    def get_all_scenarios(self) -> List[Dict[str, Any]]:
        """Returns all built-in and custom scenarios with summary counts."""
        base_list = self._cache.get("scenarios", [])
        custom_list = list(self._custom_scenarios.values())
        all_scenarios = []

        for sc in base_list + custom_list:
            total_pop = sum(i.get("population", 0) for i in sc.get("islands", []))
            total_cap = sum(s.get("max_capacity", 0) for s in sc.get("ships", []))
            all_scenarios.append({
                "id": sc.get("id"),
                "name": sc.get("name"),
                "difficulty": sc.get("difficulty", "Medium"),
                "description": sc.get("description", ""),
                "islands_count": len(sc.get("islands", [])),
                "ships_count": len(sc.get("ships", [])),
                "total_population": total_pop,
                "total_fleet_capacity": total_cap,
                "islands": sc.get("islands", []),
                "ships": sc.get("ships", [])
            })
        return all_scenarios

    def get_scenario_by_id(self, scenario_id: str) -> Optional[Dict[str, Any]]:
        """Finds scenario by unique ID."""
        if scenario_id in self._custom_scenarios:
            return self._custom_scenarios[scenario_id]
        
        for sc in self._cache.get("scenarios", []):
            if sc.get("id") == scenario_id:
                return sc
        return None

    def add_custom_scenario(self, scenario_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validates and registers a new custom scenario."""
        sc_id = scenario_data.get("id") or f"custom_{len(self._custom_scenarios) + 1}"
        scenario_data["id"] = sc_id
        if "difficulty" not in scenario_data:
            scenario_data["difficulty"] = "Custom"
        
        # Verify islands and ships can be parsed by Pydantic
        [Island(**i) for i in scenario_data.get("islands", [])]
        [RescueShip(**s) for s in scenario_data.get("ships", [])]

        self._custom_scenarios[sc_id] = scenario_data
        return scenario_data

scenario_service = ScenarioService()
