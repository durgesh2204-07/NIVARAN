import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status
from pydantic import BaseModel, Field
from app.services.spatial_regions_service import SpatialRegionsService

logger = logging.getLogger("nivaran.regions")

router = APIRouter(prefix="/gis/regions", tags=["Geospatial Regions & Administrative Boundaries"])

class RegionAnalyzeRequest(BaseModel):
    region_type: str = Field(..., description="country, state, district, taluka, or village")
    region_id: str = Field(..., description="Unique ID or code of region (e.g. tal-maval, dist-pune)")
    analysis_unit: Optional[str] = Field("grid", description="grid, village, taluka, or district")
    hazard_type: Optional[str] = Field("multi_hazard", description="multi_hazard, landslide, flood, earthquake")
    grid_resolution_km: Optional[float] = Field(1.5, description="Grid cell resolution in km (0.5 to 5.0)")

class RegionCompareRequest(BaseModel):
    region_ids: List[str] = Field(..., min_items=2, description="List of 2 or more region IDs to compare")

@router.get("/countries")
def get_countries():
    """Returns list of countries (Level 1: Country - India)."""
    country = SpatialRegionsService.get_country()
    return {
        "status": "SUCCESS",
        "level": 1,
        "total": 1,
        "countries": [{
            "id": country["id"],
            "country_code": country["country_code"],
            "name": country["name"],
            "name_hi": country["name_hi"],
            "admin_level": "Country",
            "area_sq_km": country["area_sq_km"],
            "center": country["center"],
            "bbox": country["bbox"],
            "states_count": country["states_count"],
            "source": country["source"],
            "updated_at": country["updated_at"]
        }]
    }

@router.get("/states")
def get_states(country_id: Optional[str] = Query("country-in")):
    """Returns all 36 Indian States and Union Territories (Level 2: State / UT)."""
    states = SpatialRegionsService.get_states()
    return {
        "status": "SUCCESS",
        "level": 2,
        "country_id": country_id,
        "total": len(states),
        "states": [{
            "id": s["id"],
            "state_code": s["state_code"],
            "name": s["name"],
            "name_hi": s.get("name_hi"),
            "admin_level": "State",
            "area_sq_km": s["area_sq_km"],
            "center": s["center"],
            "bbox": s["bbox"],
            "districts_count": s.get("districts_count", 0),
            "source": s["source"],
            "updated_at": s["updated_at"]
        } for s in states]
    }

@router.get("/districts")
def get_districts(state_id: Optional[str] = Query("state-mh", description="Filter by state ID or code")):
    """Returns administrative districts for the selected state (Level 3: District)."""
    districts = SpatialRegionsService.get_districts(state_id)
    return {
        "status": "SUCCESS",
        "level": 3,
        "state_id": state_id,
        "total": len(districts),
        "districts": [{
            "id": d["id"],
            "district_code": d["district_code"],
            "name": d["name"],
            "name_hi": d.get("name_hi"),
            "state_id": d["state_id"],
            "admin_level": "District",
            "area_sq_km": d["area_sq_km"],
            "center": d["center"],
            "bbox": d["bbox"],
            "talukas_count": d.get("talukas_count", 0),
            "source": d["source"],
            "updated_at": d["updated_at"]
        } for d in districts]
    }

@router.get("/talukas")
def get_talukas(district_id: Optional[str] = Query("dist-pune", description="Filter by district ID or code")):
    """Returns talukas / tehsils / subdistricts for the selected district (Level 4: Taluka)."""
    talukas = SpatialRegionsService.get_talukas(district_id)
    return {
        "status": "SUCCESS",
        "level": 4,
        "district_id": district_id,
        "total": len(talukas),
        "talukas": [{
            "id": t["id"],
            "taluka_code": t["taluka_code"],
            "name": t["name"],
            "name_hi": t.get("name_hi"),
            "district_id": t["district_id"],
            "admin_level": "Taluka",
            "area_sq_km": t["area_sq_km"],
            "center": t["center"],
            "bbox": t["bbox"],
            "villages_count": t.get("villages_count", 0),
            "source": t["source"],
            "updated_at": t["updated_at"]
        } for t in talukas]
    }

@router.get("/villages")
def get_villages(taluka_id: Optional[str] = Query("tal-maval", description="Filter by taluka ID or code")):
    """Returns revenue villages / settlements for the selected taluka (Level 5: Village)."""
    villages = SpatialRegionsService.get_villages(taluka_id)
    return {
        "status": "SUCCESS",
        "level": 5,
        "taluka_id": taluka_id,
        "total": len(villages),
        "villages": [{
            "id": v["id"],
            "village_code": v["village_code"],
            "name": v["name"],
            "name_hi": v.get("name_hi"),
            "taluka_id": v["taluka_id"],
            "admin_level": "Village",
            "area_sq_km": v["area_sq_km"],
            "center": v["center"],
            "bbox": v["bbox"],
            "population": v.get("population"),
            "households": v.get("households"),
            "elevation_m": v.get("elevation_m"),
            "slope_deg": v.get("slope_deg"),
            "source": v["source"],
            "updated_at": v["updated_at"]
        } for v in villages]
    }

@router.get("/search")
def search_regions(q: str = Query(..., min_length=2, description="Search query for state, district, taluka, or village")):
    """Searches across all administrative boundaries for quick autocomplete."""
    query = q.strip().lower()
    results = []

    # Check country
    country = SpatialRegionsService.get_country()
    if query in country["name"].lower() or query in country["country_code"].lower():
        results.append({
            "id": country["id"],
            "name": country["name"],
            "admin_level": "Country",
            "parent": "None",
            "center": country["center"],
            "bbox": country["bbox"]
        })

    # Check states
    for s in SpatialRegionsService.get_states():
        if query in s["name"].lower() or query in s["state_code"].lower():
            results.append({
                "id": s["id"],
                "name": s["name"],
                "admin_level": "State",
                "parent": "India",
                "center": s["center"],
                "bbox": s["bbox"]
            })

    # Check districts
    for d in SpatialRegionsService.get_districts():
        if query in d["name"].lower() or query in d["district_code"].lower():
            results.append({
                "id": d["id"],
                "name": d["name"],
                "admin_level": "District",
                "parent": "Maharashtra",
                "center": d["center"],
                "bbox": d["bbox"]
            })

    # Check talukas
    for t in SpatialRegionsService.get_talukas():
        if query in t["name"].lower() or query in t["taluka_code"].lower():
            results.append({
                "id": t["id"],
                "name": t["name"],
                "admin_level": "Taluka",
                "parent": t.get("district_id", "District"),
                "center": t["center"],
                "bbox": t["bbox"]
            })

    # Check villages
    for v in SpatialRegionsService.get_villages():
        if query in v["name"].lower() or query in v["village_code"].lower():
            results.append({
                "id": v["id"],
                "name": v["name"],
                "admin_level": "Village",
                "parent": v.get("taluka_id", "Taluka"),
                "center": v["center"],
                "bbox": v["bbox"]
            })

    return {"status": "SUCCESS", "query": q, "results": results[:15], "total": len(results)}

@router.get("/{region_type}/{region_id}")
def get_region_detail(region_type: str, region_id: str):
    """Retrieves full region attributes, metadata and parent hierarchy."""
    reg = SpatialRegionsService.find_region_by_type_and_id(region_type, region_id)
    if not reg:
        raise HTTPException(status_code=404, detail=f"Region '{region_id}' of type '{region_type}' not found.")
    
    clean_reg = {k: v for k, v in reg.items() if k != "geometry"}
    return {"status": "SUCCESS", "region_type": region_type, "region": clean_reg}

@router.get("/{region_type}/{region_id}/boundary")
def get_region_boundary(region_type: str, region_id: str):
    """Retrieves actual PostGIS geometry feature for MapLibre layer rendering."""
    feature = SpatialRegionsService.get_region_boundary_geojson(region_type, region_id)
    if not feature:
        raise HTTPException(status_code=404, detail=f"Boundary for region '{region_id}' not found.")
    return feature

@router.get("/{region_type}/{region_id}/summary")
def get_region_summary(region_type: str, region_id: str):
    """
    Returns complete region analysis parameters:
    - Terrain (Elevation, Slope, Aspect, Terrain variation, Flow accumulation)
    - Weather & Hydrology (Rainfall, River proximity, Drainage network)
    - Environmental (LULC, Forest cover, Water bodies, Soil)
    - Population & Infrastructure (Population exposure, Settlement density, Road connectivity)
    - 0-100 Risk assessment and categorical breakdown
    - Data quality and observation dates
    """
    summary = SpatialRegionsService.get_region_summary(region_type, region_id)
    if "error" in summary:
        raise HTTPException(status_code=404, detail=summary["error"])
    return summary

@router.get("/{region_type}/{region_id}/risk-zones")
def get_region_risk_zones(
    region_type: str,
    region_id: str,
    analysis_unit: Optional[str] = Query("grid", description="grid, village, taluka, or district"),
    hazard_type: Optional[str] = Query("multi_hazard", description="multi_hazard, landslide, flood"),
    resolution_km: Optional[float] = Query(1.5, description="Grid resolution in km")
):
    """Returns GeoJSON FeatureCollection of calculated risk zones clipped to the region boundary."""
    res = SpatialRegionsService.run_regional_gis_analysis(
        region_type=region_type,
        region_id=region_id,
        analysis_unit=analysis_unit or "grid",
        hazard_type=hazard_type or "multi_hazard",
        grid_resolution_km=resolution_km or 1.5
    )
    if res.get("status") == "ERROR":
        raise HTTPException(status_code=404, detail=res.get("message"))
    return res

@router.post("/analyze")
def analyze_selected_region(req: RegionAnalyzeRequest):
    """
    Executes live multi-hazard spatial analysis on demand:
    1. Clips spatial datasets to region polygon.
    2. Computes hazard, vulnerability, and exposure scores.
    3. Synthesizes color-coded risk units (0-100 index).
    4. Returns GeoJSON FeatureCollection and summary statistics.
    """
    res = SpatialRegionsService.run_regional_gis_analysis(
        region_type=req.region_type,
        region_id=req.region_id,
        analysis_unit=req.analysis_unit or "grid",
        hazard_type=req.hazard_type or "multi_hazard",
        grid_resolution_km=req.grid_resolution_km or 1.5
    )
    if res.get("status") == "ERROR":
        raise HTTPException(status_code=404, detail=res.get("message"))
    return res

@router.post("/compare")
def compare_regions(req: RegionCompareRequest):
    """
    Performs multi-region comparative analysis side-by-side:
    Compares elevation, slope, rainfall, hazard score, vulnerability,
    exposure, overall risk, high-risk area, and population exposure.
    """
    res = SpatialRegionsService.compare_regions(req.region_ids)
    return res

