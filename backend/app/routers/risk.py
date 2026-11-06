from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, Query, HTTPException, Body
from app.database import get_db
from app.config import settings
from app.services.risk_engine import DisasterRiskEngine, classify_risk_score

router = APIRouter(prefix="/risk", tags=["Disaster Risk Scoring & Configuration"])

@router.get("/summary")
def get_risk_summary(district: Optional[str] = Query(None)):
    """Computes overall risk summary from real MongoDB settlement and cell collections."""
    db = get_db()
    flt = {}
    if district and district != "All":
        flt["district"] = district

    settlements = list(db.settlements.find(flt))
    cells = list(db.analysis_cells.find(flt))
    risk_zones = list(db.risk_zones.find(flt))

    # Category counts
    category_counts = {
        "Very High Risk": 0,
        "High Risk": 0,
        "Moderate Risk": 0,
        "Low Risk": 0,
        "Very Low Risk": 0,
    }

    total_exposed_pop = 0
    total_hh_to_relocate = 0

    for s in settlements:
        cat = s.get("risk_category", "Moderate Risk")
        if cat in category_counts:
            category_counts[cat] += 1
        if cat in ["Very High Risk", "High Risk"]:
            total_exposed_pop += s.get("population", 0)
            total_hh_to_relocate += s.get("households", 0)

    return {
        "district": district or "All Monitored Regions",
        "total_analysis_cells": len(cells),
        "total_settlements_evaluated": len(settlements),
        "total_risk_zones_active": len(risk_zones),
        "distribution_by_category": category_counts,
        "population_exposed_high_risk": total_exposed_pop,
        "households_needing_relocation": total_hh_to_relocate,
        "analysis_timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "scoring_method": "Multi-Criteria Standardized 0-100 (PS 26191)"
    }

@router.get("/distribution")
def get_risk_distribution(district: Optional[str] = Query(None)):
    """Returns histogram bins and risk category percentages for visual charts."""
    db = get_db()
    flt = {}
    if district and district != "All":
        flt["district"] = district

    settlements = list(db.settlements.find(flt))
    bins = {
        "80-100 (Very High)": 0,
        "60-79 (High)": 0,
        "40-59 (Moderate)": 0,
        "20-39 (Low)": 0,
        "0-19 (Very Low)": 0,
    }

    for s in settlements:
        score = s.get("overall_risk_score", 0.0)
        if score >= 80.0:
            bins["80-100 (Very High)"] += 1
        elif score >= 60.0:
            bins["60-79 (High)"] += 1
        elif score >= 40.0:
            bins["40-59 (Moderate)"] += 1
        elif score >= 20.0:
            bins["20-39 (Low)"] += 1
        else:
            bins["0-19 (Very Low)"] += 1

    chart_data = [
        {"range": k, "count": v, "color": settings.RISK_CATEGORIES[
            "VERY_HIGH" if "80-100" in k else
            "HIGH" if "60-79" in k else
            "MODERATE" if "40-59" in k else
            "LOW" if "20-39" in k else "VERY_LOW"
        ]["color"]}
        for k, v in bins.items()
    ]

    return {
        "histogram": chart_data,
        "total_records": len(settlements)
    }

@router.get("/configuration")
def get_risk_configuration():
    """Returns the current configurable indicator weights and category boundary rules."""
    return {
        "hazard_weights": settings.DEFAULT_HAZARD_WEIGHTS,
        "overall_weights": settings.DEFAULT_OVERALL_WEIGHTS,
        "risk_categories": settings.RISK_CATEGORIES,
        "version": "v2.0-ps26191"
    }

@router.get("/zone/{zone_id}")
def get_zone_calculation_breakdown(zone_id: str):
    """Inspects complete mathematical calculation, contributing indicators and confidence for a zone."""
    db = get_db()
    zone = db.risk_zones.find_one({"zone_id": zone_id})
    if not zone:
        raise HTTPException(status_code=404, detail=f"Risk zone '{zone_id}' not found.")

    zone["_id"] = str(zone["_id"])
    return {
        "zone_id": zone["zone_id"],
        "name": zone.get("name"),
        "disaster_type": zone.get("disaster_type"),
        "risk_score": zone.get("risk_score"),
        "risk_category": zone.get("risk_category"),
        "map_colour": zone.get("map_colour"),
        "hazard_score": zone.get("hazard_score"),
        "vulnerability_score": zone.get("vulnerability_score"),
        "exposure_score": zone.get("exposure_score"),
        "contributing_indicators": zone.get("contributing_indicators"),
        "source_datasets": zone.get("source_datasets"),
        "analysis_timestamp": zone.get("analysis_timestamp"),
        "confidence_score": zone.get("confidence_score", 0.92)
    }

@router.post("/recalculate")
def recalculate_risk_scores(payload: Dict[str, Any] = Body(...)):
    """Allows authorized analysts to update indicator weights and re-score all settlements."""
    db = get_db()
    new_hazard_weights = payload.get("hazard_weights", settings.DEFAULT_HAZARD_WEIGHTS)
    new_overall_weights = payload.get("overall_weights", settings.DEFAULT_OVERALL_WEIGHTS)

    settlements = list(db.settlements.find())
    updated_count = 0

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    for s in settlements:
        risk_res = DisasterRiskEngine.compute_full_risk(
            rainfall_val=s.get("annual_rainfall_mm"),
            slope_deg=s.get("slope_deg"),
            past_incidents=s.get("past_incidents"),
            river_dist_km=s.get("river_dist_km"),
            population=s.get("population", 250),
            households=s.get("households", 50),
            hazard_weights=new_hazard_weights,
            overall_weights=new_overall_weights,
            is_24h_rain=False
        )

        db.settlements.update_one(
            {"id": s["id"]},
            {"$set": {
                "hazard_score": risk_res.hazard_score,
                "vulnerability_score": risk_res.vulnerability_score,
                "exposure_score": risk_res.exposure_score,
                "overall_risk_score": risk_res.score,
                "risk_category": risk_res.category,
                "map_colour": risk_res.color_hex,
                "category_code": risk_res.category_code,
                "updated_at": now_str
            }}
        )
        updated_count += 1

    return {
        "status": "SUCCESS",
        "updated_settlements_count": updated_count,
        "applied_hazard_weights": new_hazard_weights,
        "applied_overall_weights": new_overall_weights,
        "timestamp": now_str
    }

