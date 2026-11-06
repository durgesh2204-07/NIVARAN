import math
from typing import List, Dict, Any, Optional
from app.database import get_db

def calculate_carrying_capacity(
    usable_area_ha: float,
    land_per_hh_ha: float = 0.08,
    water_reliability_score: float = 0.70,
    existing_occupied_hh: int = 0
) -> Dict[str, Any]:
    """
    Standard Problem Statement 26191 Restrictive Carrying Capacity Formula:
    Gross = floor(usable_area_ha / land_per_hh_ha)
    Safe Capacity = floor(Gross * water_reliability_score)
    Remaining = max(0, Safe Capacity - existing_occupied_hh)
    """
    gross = math.floor(usable_area_ha / max(0.01, land_per_hh_ha))
    safe = math.floor(gross * max(0.1, min(1.0, water_reliability_score)))
    remaining = max(0, safe - existing_occupied_hh)

    if remaining >= 100:
        traffic_light = "Green"
    elif remaining >= 30:
        traffic_light = "Yellow"
    else:
        traffic_light = "Red"

    return {
        "usable_area_ha": usable_area_ha,
        "land_per_hh_ha": land_per_hh_ha,
        "water_reliability_score": water_reliability_score,
        "existing_occupied_hh": existing_occupied_hh,
        "gross_capacity": gross,
        "safe_carrying_capacity": safe,
        "remaining_capacity": remaining,
        "traffic_light": traffic_light
    }

def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

class RelocationEngine:
    @classmethod
    def get_candidate_sites(cls, district: Optional[str] = None) -> List[Dict[str, Any]]:
        db = get_db()
        flt = {}
        if district and district != "All":
            flt["district"] = district
        sites = list(db.candidate_sites.find(flt))
        for s in sites:
            cap = calculate_carrying_capacity(
                usable_area_ha=s.get("usable_area_ha", 40.0),
                land_per_hh_ha=s.get("land_per_hh_ha", 0.08),
                water_reliability_score=s.get("water_reliability_score", 0.75),
                existing_occupied_hh=s.get("existing_occupied_hh", 0)
            )
            s.update(cap)
        return sites

    @classmethod
    def compute_greedy_relocation_plan(cls, district: Optional[str] = None) -> List[Dict[str, Any]]:
        db = get_db()
        flt = {}
        if district and district != "All":
            flt["district"] = district

        settlements = list(db.settlements.find(flt))
        # Sort settlements descending by overall_risk_score
        settlements.sort(key=lambda x: x.get("overall_risk_score", 0.0), reverse=True)

        sites = cls.get_candidate_sites(district)
        # Track available capacity on sites
        available_caps = {s["id"]: s["remaining_capacity"] for s in sites}
        sites_map = {s["id"]: s for s in sites}

        ranked_plan = []
        for rank, st in enumerate(settlements, start=1):
            st_lat = st.get("lat", 18.5)
            st_lng = st.get("lng", 73.5)
            st_hh = st.get("households", 50)

            # Find nearest suitable safe site with available capacity
            candidates = []
            for s in sites:
                dist = haversine_km(st_lat, st_lng, s["lat"], s["lng"])
                candidates.append((dist, s["id"], s["name"]))
            candidates.sort(key=lambda x: x[0])

            assigned_id = candidates[0][1] if candidates else "site-none"
            assigned_name = candidates[0][2] if candidates else "Regional Buffer Camp"
            dist_km = candidates[0][0] if candidates else 0.0

            # Find one with remaining capacity if possible
            for d, sid, sname in candidates:
                if available_caps.get(sid, 0) >= st_hh:
                    assigned_id = sid
                    assigned_name = sname
                    dist_km = d
                    available_caps[sid] -= st_hh
                    break

            ranked_plan.append({
                "rank": rank,
                "settlement_id": st.get("id"),
                "settlement_name": st.get("name"),
                "district": st.get("district"),
                "taluka": st.get("taluka"),
                "households": st_hh,
                "overall_risk_score": st.get("overall_risk_score", 75.0),
                "risk_category": st.get("risk_category", "High Risk"),
                "assigned_site_id": assigned_id,
                "assigned_site_name": assigned_name,
                "distance_km": dist_km,
                "allocated_households": st_hh
            })

        return ranked_plan

