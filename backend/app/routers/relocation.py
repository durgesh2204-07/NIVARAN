from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Query, HTTPException, status
from app.database import get_db
from app.services.relocation import RelocationEngine
from app.models.schemas import ScenarioRequest, ScenarioResponse

router = APIRouter(prefix="/relocation", tags=["Relocation Decision Support & Scenarios"])

@router.get("/sites")
def get_candidate_relocation_sites(district: Optional[str] = Query(None)):
    """Returns candidate safe host plateaus with restrictive carrying capacity calculations."""
    sites = RelocationEngine.get_candidate_sites(district)
    for s in sites:
        s["_id"] = str(s.get("_id", ""))
    return {"sites": sites, "count": len(sites)}

@router.get("/priorities")
def get_ranked_relocation_priorities(district: Optional[str] = Query(None)):
    """
    Returns ranked relocation priority schedule based on PS 26191 multi-criteria algorithm
    and greedy site matching.
    """
    plan = RelocationEngine.compute_greedy_relocation_plan(district)
    return {"plan": plan, "total": len(plan)}

@router.post("/scenarios", response_model=ScenarioResponse)
def execute_what_if_scenario(req: ScenarioRequest):
    """
    Executes what-if scenario (extreme cloudburst rainfall, dam discharge increase)
    and saves outputs in MongoDB scenario_runs collection (Part 9).
    """
    db = get_db()
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    scenario_id = f"scen-{int(datetime.now().timestamp() * 1000)}"

    settlements = list(db.settlements.find({"district": req.district} if req.district != "All" else {}))
    baseline_red = [s for s in settlements if s.get("risk_category") == "Very High Risk"]

    newly_flipped = []
    total_displaced = 0

    for s in settlements:
        # Increase rainfall by req.extra_rainfall_mm
        curr_score = s.get("overall_risk_score", 50.0)
        # Extra rainfall stress factor: +0.08 risk per 50mm extra rain
        stressed_score = min(100.0, curr_score + (req.extra_rainfall_mm / 50.0) * 4.2)
        if curr_score < 80.0 and stressed_score >= 80.0:
            newly_flipped.append(f"{s.get('name')} ({curr_score:.1f} → {stressed_score:.1f})")
            total_displaced += s.get("households", 50)

    total_red = len(baseline_red) + len(newly_flipped)
    deficit = max(0, (total_displaced + sum(b.get("households", 0) for b in baseline_red)) - 350)

    doc = {
        "scenario_id": scenario_id,
        "name": req.scenario_name,
        "district": req.district,
        "extra_rainfall_mm": req.extra_rainfall_mm,
        "climate_horizon_years": req.climate_horizon_years,
        "baseline_red_zones": len(baseline_red),
        "simulated_red_zones": total_red,
        "newly_flipped_villages": newly_flipped,
        "total_displaced_households": total_displaced,
        "safe_capacity_deficit": deficit,
        "created_at": now_str,
    }

    db.scenario_runs.insert_one(doc)

    return ScenarioResponse(
        scenario_id=scenario_id,
        name=req.scenario_name,
        timestamp=now_str,
        baseline_red_zones=len(baseline_red),
        simulated_red_zones=total_red,
        newly_flipped_villages=newly_flipped,
        total_displaced_households=total_displaced,
        safe_capacity_deficit=deficit
    )

@router.get("/scenarios/{scenario_id}")
def get_scenario_result(scenario_id: str):
    """Retrieves previous what-if simulation run from MongoDB."""
    db = get_db()
    scen = db.scenario_runs.find_one({"scenario_id": scenario_id})
    if not scen:
        raise HTTPException(status_code=404, detail="Scenario run not found")
    scen["_id"] = str(scen["_id"])
    return scen

