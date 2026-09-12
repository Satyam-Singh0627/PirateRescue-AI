import pytest
from services.distance_service import DistanceService

def test_haversine_same_point():
    dist = DistanceService.haversine(17.936, -76.841, 17.936, -76.841)
    assert dist == 0.0

def test_haversine_caribbean_benchmark():
    # Kingston Jamaica (17.971, -76.793) to Port-au-Prince Haiti (18.594, -72.307)
    # Great circle distance is roughly 255-275 nautical miles
    dist = DistanceService.haversine(17.971, -76.793, 18.594, -72.307)
    assert 250.0 < dist < 280.0

def test_travel_time():
    # 50 nm at 25 knots = 2 hours = 120 mins
    time_mins = DistanceService.calculate_travel_time(50.0, 25.0)
    assert round(time_mins, 1) == 120.0

def test_bearing():
    # Heading due North (lat 10 -> 20, same lon)
    bearing_north = DistanceService.calculate_bearing(10.0, -70.0, 20.0, -70.0)
    assert round(bearing_north, 1) == 0.0 or round(bearing_north, 1) == 360.0

    # Heading due East (same lat, lon -75 -> -70)
    bearing_east = DistanceService.calculate_bearing(0.0, -75.0, 0.0, -70.0)
    assert round(bearing_east, 1) == 90.0

def test_interpolate():
    lat, lon = DistanceService.interpolate_position(10.0, -70.0, 20.0, -60.0, 0.5)
    assert lat == 15.0
    assert lon == -65.0
