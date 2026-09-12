import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from starlette.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "Pirate" in data["service"]

def test_get_scenarios():
    res = client.get("/api/scenarios")
    assert res.status_code == 200
    scenarios = res.json()
    assert len(scenarios) >= 4
    # Check that tutorial_calm is present
    sc_ids = [s["id"] for s in scenarios]
    assert "tutorial_calm" in sc_ids
    assert "gale_of_tortuga" in sc_ids

def test_get_base_port():
    res = client.get("/api/scenarios/base/port")
    assert res.status_code == 200
    data = res.json()
    assert "port_royal" in data["id"]
    assert data["latitude"] == 17.936

def test_solve_endpoint_with_standard_scenario():
    # Fetch tutorial scenario
    sc_res = client.get("/api/scenarios/tutorial_calm")
    assert sc_res.status_code == 200
    scenario = sc_res.json()

    solve_payload = {
        "scenario_id": scenario["id"],
        "islands": scenario["islands"],
        "ships": scenario["ships"],
        "base_position": [17.936, -76.841],
        "algorithm": "greedy"
    }
    res = client.post("/api/solve", json=solve_payload)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    plan = body["plan"]
    assert plan["total_lives_saved"] > 0
    assert len(plan["routes"]) == len(scenario["ships"])
