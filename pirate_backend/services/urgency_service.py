from typing import List
from models.island import Island

class UrgencyService:
    """Calculates prioritized triage scores for disaster-stricken islands."""

    CRITICAL_SUPPLIES = {"blood", "plasma", "surgical", "surgeons", "trauma", "clean water", "antidote"}

    @staticmethod
    def calculate_priority_score(island: Island) -> float:
        """
        Computes a comprehensive urgency score (0.0 to 100.0) considering:
        - Base scenario urgency score (40%)
        - Vulnerable demographic ratio (30%)
        - Critical medical needs presence (15%)
        - Environmental hazard level (15%)
        """
        vuln_ratio = island.vulnerable_ratio  # 0.0 - 1.0
        
        # Medical severity
        med_score = 0.0
        if island.medical_needs:
            critical_hits = sum(
                1 for need in island.medical_needs
                if any(crit in need.lower() for crit in UrgencyService.CRITICAL_SUPPLIES)
            )
            med_score = min(1.0, 0.4 + (critical_hits * 0.2) + (len(island.medical_needs) * 0.1))
        
        # Hazard factor normalized (0.5 to 3.0 -> 0.0 to 1.0)
        hazard_score = min(1.0, max(0.0, (island.hazard_level - 0.5) / 2.5))

        composite = (
            (island.urgency_score / 100.0) * 0.40
            + vuln_ratio * 0.30
            + med_score * 0.15
            + hazard_score * 0.15
        ) * 100.0

        return round(min(100.0, max(0.0, composite)), 2)

    @staticmethod
    def classify_urgency(score: float) -> str:
        """Assigns categorical triage urgency level."""
        if score >= 85.0:
            return "CRITICAL"
        elif score >= 65.0:
            return "HIGH"
        elif score >= 40.0:
            return "MEDIUM"
        else:
            return "LOW"
