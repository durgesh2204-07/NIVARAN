from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr

# ==============================================================================
# AUTH & USER SCHEMAS (Part 8)
# ==============================================================================

class UserLogin(BaseModel):
    email: str = Field(..., example="admin@nivaran.gov.in")
    password: str = Field(..., example="Nivaran@Admin2026")

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = Field(default="Analyst", description="Administrator, District Administrator, Analyst, Volunteer, Citizen")
    department: Optional[str] = "Disaster Management Cell"
    district: Optional[str] = "Raigad"

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    department: Optional[str]
    district: Optional[str]
    is_active: bool
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

# ==============================================================================
# RISK SCORING SCHEMAS (Part 1)
# ==============================================================================

class HazardWeights(BaseModel):
    rainfall_risk: float = 0.35
    slope_risk: float = 0.30
    history_risk: float = 0.20
    river_proximity_risk: float = 0.15

class OverallWeights(BaseModel):
    hazard_weight: float = 0.50
    vulnerability_weight: float = 0.30
    exposure_weight: float = 0.20

class RiskCategoryInfo(BaseModel):
    name: str
    code: str
    color_hex: str
    min_score: float
    max_score: float
    action: str

class RiskIndicatorBreakdown(BaseModel):
    indicator: str
    raw_value: Optional[float]
    unit: str
    normalized_score: Optional[float] # 0-100
    weight: float
    contribution: float
    source_dataset: str
    data_available: bool

class RiskScoreResult(BaseModel):
    score: float # 0 - 100
    category: str # "Very High Risk", "High Risk", "Moderate Risk", "Low Risk", "Very Low Risk"
    color_hex: str # #DC2626, #EAB308, #F97316, #84CC16, #16A34A
    category_code: str # RED, YELLOW, ORANGE, LIGHT_GREEN, GREEN
    hazard_score: float
    vulnerability_score: float
    exposure_score: float
    status: str # "validated", "insufficient_data", "partial"
    confidence_score: float # 0.0 - 1.0
    missing_indicators: List[str]
    breakdown: List[RiskIndicatorBreakdown]

# ==============================================================================
# GEOSPATIAL SCHEMAS (Part 2 & Part 7)
# ==============================================================================

class GeoJSONGeometry(BaseModel):
    type: str # "Point", "Polygon", "MultiPolygon"
    coordinates: Any

class RiskZoneFeature(BaseModel):
    zone_id: str
    name: str
    district: str
    disaster_type: str
    risk_score: float
    risk_category: str
    map_colour: str
    hazard_score: float
    vulnerability_score: float
    exposure_score: float
    affected_area_sqkm: float
    exposed_population: int
    contributing_indicators: Dict[str, Any]
    source_datasets: List[str]
    analysis_version: str
    analysis_timestamp: str
    confidence_score: float
    geometry: GeoJSONGeometry

class SettlementItem(BaseModel):
    id: str
    name: str
    name_hi: Optional[str] = None
    name_mr: Optional[str] = None
    district: str
    taluka: str
    population: int
    households: int
    elevation_m: float
    slope_deg: float
    annual_rainfall_mm: float
    river_dist_km: float
    primary_hazard: str
    hazard_score: float # 0 - 100
    vulnerability_score: float # 0 - 100
    overall_risk_score: float # 0 - 100
    risk_category: str
    map_colour: str
    geometry: GeoJSONGeometry

# ==============================================================================
# RELOCATION SCHEMAS (Part 9)
# ==============================================================================

class CandidateSiteItem(BaseModel):
    id: str
    name: str
    district: str
    taluka: str
    usable_area_ha: float
    land_per_hh_ha: float = 0.08
    water_reliability_score: float
    existing_occupied_hh: int
    gross_capacity: int
    safe_carrying_capacity: int
    remaining_capacity: int
    traffic_light: str # "Green", "Yellow", "Red"
    elevation_m: float
    slope_deg: float
    geometry: GeoJSONGeometry

class RelocationAllocationItem(BaseModel):
    rank: int
    settlement_id: str
    settlement_name: str
    district: str
    households: int
    overall_risk_score: float
    risk_category: str
    assigned_site_id: str
    assigned_site_name: str
    distance_km: float
    allocated_households: int

class ScenarioRequest(BaseModel):
    scenario_name: str
    district: str = "Raigad"
    extra_rainfall_mm: float = 0.0 # 0 to 300 mm cloudburst simulation
    climate_horizon_years: int = 0 # 0, 10, 20 years
    dam_discharge_increase_pct: float = 0.0
    hazard_weights: Optional[HazardWeights] = None

class ScenarioResponse(BaseModel):
    scenario_id: str
    name: str
    timestamp: str
    baseline_red_zones: int
    simulated_red_zones: int
    newly_flipped_villages: List[str]
    total_displaced_households: int
    safe_capacity_deficit: int

