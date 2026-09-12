import math
from typing import Tuple, Dict, List

class DistanceService:
    """Geographic distance and navigation calculations using Haversine formula."""
    
    EARTH_RADIUS_NM = 3440.065  # Earth radius in Nautical Miles

    @staticmethod
    def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculates great-circle distance between two geographic coordinates in Nautical Miles.
        """
        # Handle identical points
        if lat1 == lat2 and lon1 == lon2:
            return 0.0

        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (
            math.sin(delta_phi / 2.0) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
        )
        # Numerical safety clamp
        a = min(1.0, max(0.0, a))
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return DistanceService.EARTH_RADIUS_NM * c

    @staticmethod
    def calculate_travel_time(distance_nm: float, speed_knots: float) -> float:
        """Calculates travel time in minutes."""
        safe_speed = max(speed_knots, 0.1)
        return (distance_nm / safe_speed) * 60.0

    @staticmethod
    def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculates initial compass bearing from point 1 to point 2 in degrees (0-360).
        """
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_lambda = math.radians(lon2 - lon1)

        y = math.sin(delta_lambda) * math.cos(phi2)
        x = (
            math.cos(phi1) * math.sin(phi2)
            - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
        )
        theta = math.atan2(y, x)
        bearing = (math.degrees(theta) + 360.0) % 360.0
        return bearing

    @staticmethod
    def interpolate_position(
        lat1: float, lon1: float, lat2: float, lon2: float, fraction: float
    ) -> Tuple[float, float]:
        """
        Interpolates geographic position along a segment for smooth animation playback.
        fraction is between 0.0 (start) and 1.0 (end).
        """
        clamped_frac = min(1.0, max(0.0, fraction))
        lat = lat1 + (lat2 - lat1) * clamped_frac
        lon = lon1 + (lon2 - lon1) * clamped_frac
        return (lat, lon)

    @staticmethod
    def build_distance_matrix(
        base_position: Tuple[float, float],
        locations: Dict[str, Tuple[float, float]]
    ) -> Dict[str, Dict[str, float]]:
        """
        Precomputes distance matrix between base and all location IDs.
        """
        all_pts: Dict[str, Tuple[float, float]] = {"base": base_position, **locations}
        matrix: Dict[str, Dict[str, float]] = {}

        for id1, pt1 in all_pts.items():
            matrix[id1] = {}
            for id2, pt2 in all_pts.items():
                if id1 == id2:
                    matrix[id1][id2] = 0.0
                else:
                    matrix[id1][id2] = DistanceService.haversine(
                        pt1[0], pt1[1], pt2[0], pt2[1]
                    )

        return matrix
