from typing import Dict, Any, List, Optional
from app.config import settings
from app.models.schemas import RiskScoreResult, RiskIndicatorBreakdown

def classify_risk_score(score: float) -> Dict[str, str]:
    """
    Standardized, Non-Overlapping 0-100 Risk Classification Function (Section 1).
    Used consistently across the map, dashboard, reports, and API responses.

    Exact boundary rules:
    - 80.00 to 100.00: VERY HIGH RISK -> RED (#DC2626)
    - 60.00 to < 80.00: HIGH RISK -> YELLOW (#EAB308)
    - 40.00 to < 60.00: MODERATE RISK -> ORANGE (#F97316)
    - 20.00 to < 40.00: LOW RISK -> LIGHT GREEN (#84CC16)
    - 0.00 to < 20.00: VERY LOW RISK -> GREEN (#16A34A)
    """
    clamped = max(0.0, min(100.0, round(score, 4)))

    if clamped >= 80.0:
        cat = settings.RISK_CATEGORIES["VERY_HIGH"]
    elif clamped >= 60.0:
        cat = settings.RISK_CATEGORIES["HIGH"]
    elif clamped >= 40.0:
        cat = settings.RISK_CATEGORIES["MODERATE"]
    elif clamped >= 20.0:
        cat = settings.RISK_CATEGORIES["LOW"]
    else:
        cat = settings.RISK_CATEGORIES["VERY_LOW"]

    return {
        "category": cat["name"].upper(),
        "category_code": cat["code"],
        "color_hex": cat["color"],
        "action": cat["action"],
    }

class DisasterRiskEngine:
    """
    Multi-Hazard Risk Engine with Separate Specialized Models for:
    - Landslide
    - Flood
    - Drought
    - Cyclone
    - Earthquake
    """

    @staticmethod
    def normalize_rainfall(annual_mm: Optional[float] = None, rain_24h_mm: Optional[float] = None) -> Optional[float]:
        """Normalizes rainfall against Western Ghats / IMD extreme criteria (0-100 scale)."""
        if rain_24h_mm is not None:
            return min(100.0, max(0.0, (rain_24h_mm / 250.0) * 100.0))
        if annual_mm is not None:
            return min(100.0, max(0.0, (annual_mm / 4500.0) * 100.0))
        return None

    @staticmethod
    def normalize_slope(slope_deg: Optional[float]) -> Optional[float]:
        """Normalizes terrain slope angle in degrees (45 deg = 100% shear failure threshold)."""
        if slope_deg is None:
            return None
        return min(100.0, max(0.0, (slope_deg / 45.0) * 100.0))

    @staticmethod
    def normalize_history(past_incidents: Optional[int]) -> Optional[float]:
        """Normalizes historical disaster incidence (5+ major events = 100)."""
        if past_incidents is None:
            return None
        return min(100.0, max(0.0, (past_incidents / 5.0) * 100.0))

    @staticmethod
    def normalize_river_proximity(river_dist_km: Optional[float]) -> Optional[float]:
        """Normalizes river proximity risk using inverse distance decay (<200m = ~98; >5km = 0)."""
        if river_dist_km is None:
            return None
        if river_dist_km <= 0.2:
            return 98.0
        if river_dist_km >= 5.0:
            return 0.0
        return max(0.0, (1.0 - (river_dist_km / 5.0)) * 100.0)

    # --------------------------------------------------------------------------
    # 1. LANDSLIDE HAZARD MODEL
    # Slope (35%) + Rainfall (35%) + History (15%) + River Toe Erosion (15%)
    # --------------------------------------------------------------------------
    @classmethod
    def calculate_landslide_hazard(
        cls,
        rainfall_val: Optional[float],
        slope_deg: Optional[float],
        past_incidents: Optional[int],
        river_dist_km: Optional[float],
        is_24h_rain: bool = False
    ) -> Dict[str, Any]:
        r_norm = cls.normalize_rainfall(rain_24h_mm=rainfall_val if is_24h_rain else None, annual_mm=rainfall_val if not is_24h_rain else None)
        s_norm = cls.normalize_slope(slope_deg)
        h_norm = cls.normalize_history(past_incidents)
        rv_norm = cls.normalize_river_proximity(river_dist_km)

        weights = {"slope": 0.35, "rainfall": 0.35, "history": 0.15, "toe_undercut": 0.15}
        indicators = [
            ("Slope Stability (>25° Critical)", s_norm, weights["slope"], "SRTM DEM 30m / GSI Slope Inclinometry"),
            ("Extreme Precipitation", r_norm, weights["rainfall"], "IMD Automatic Weather Station Telemetry"),
            ("Historical Landslide Scarp Recurrence", h_norm, weights["history"], "GSI Bhukosh Landslide Database"),
            ("Slope Toe River Erosion / Saturated Culverts", rv_norm, weights["toe_undercut"], "CWC Hydrographic Drainage")
        ]
        return cls._aggregate_hazard_result("landslide", indicators)

    # --------------------------------------------------------------------------
    # 2. FLOOD HAZARD MODEL
    # Rainfall (40%) + River Proximity (30%) + Low Basin Inundation / Flat Slope (20%) + History (10%)
    # --------------------------------------------------------------------------
    @classmethod
    def calculate_flood_hazard(
        cls,
        rainfall_val: Optional[float],
        river_dist_km: Optional[float],
        slope_deg: Optional[float],
        past_incidents: Optional[int],
        is_24h_rain: bool = False
    ) -> Dict[str, Any]:
        r_norm = cls.normalize_rainfall(rain_24h_mm=rainfall_val if is_24h_rain else None, annual_mm=rainfall_val if not is_24h_rain else None)
        rv_norm = cls.normalize_river_proximity(river_dist_km)
        # For flooding, flatter slope = higher ponding risk
        flat_norm = None if slope_deg is None else max(0.0, min(100.0, (1.0 - (slope_deg / 20.0)) * 100.0))
        h_norm = cls.normalize_history(past_incidents)

        weights = {"rainfall": 0.40, "river_proximity": 0.30, "flat_basin": 0.20, "history": 0.10}
        indicators = [
            ("Heavy Runoff / Rainfall Intensity", r_norm, weights["rainfall"], "IMD Radar & Telemetry"),
            ("Riverbank Proximity & Spillway Buffer", rv_norm, weights["river_proximity"], "CWC Flood Forecasting System"),
            ("Low Elevation Inundation Basin (Slope <10°)", flat_norm, weights["flat_basin"], "SRTM Elevation Floodplain Model"),
            ("Historical Flood Level Records", h_norm, weights["history"], "State Water Resources Flood Archive")
        ]
        return cls._aggregate_hazard_result("flood", indicators)

    # --------------------------------------------------------------------------
    # 3. DROUGHT HAZARD MODEL
    # Rainfall Deficit (45%) + Temperature/Evapotranspiration (30%) + Soil Moisture (25%)
    # --------------------------------------------------------------------------
    @classmethod
    def calculate_drought_hazard(
        cls,
        rainfall_val: Optional[float],
        temperature_c: Optional[float] = 34.0,
        soil_moisture_pct: Optional[float] = 18.0
    ) -> Dict[str, Any]:
        # Deficit against 1200 mm baseline
        r_deficit_norm = None if rainfall_val is None else max(0.0, min(100.0, (1.0 - (rainfall_val / 2000.0)) * 100.0))
        temp_norm = None if temperature_c is None else max(0.0, min(100.0, ((temperature_c - 25.0) / 20.0) * 100.0))
        moist_deficit = None if soil_moisture_pct is None else max(0.0, min(100.0, (1.0 - (soil_moisture_pct / 50.0)) * 100.0))

        indicators = [
            ("Monsoon Precipitation Deficit", r_deficit_norm, 0.45, "IMD Agricultural Meteorology"),
            ("High Heat & Evapotranspiration Index", temp_norm, 0.30, "Open-Meteo High-Resolution Gridded Model"),
            ("Root-Zone Soil Moisture Depletion", moist_deficit, 0.25, "Bhuvan Drought Telemetry (NRSC)")
        ]
        return cls._aggregate_hazard_result("drought", indicators)

    # --------------------------------------------------------------------------
    # 4. CYCLONE HAZARD MODEL
    # Wind Speed (40%) + Coastal Proximity (30%) + Storm Surge (20%) + Rain (10%)
    # --------------------------------------------------------------------------
    @classmethod
    def calculate_cyclone_hazard(
        cls,
        wind_speed_kmh: Optional[float] = 95.0,
        coast_dist_km: Optional[float] = 15.0,
        rainfall_val: Optional[float] = 180.0
    ) -> Dict[str, Any]:
        wind_norm = None if wind_speed_kmh is None else max(0.0, min(100.0, (wind_speed_kmh / 220.0) * 100.0))
        coast_norm = None if coast_dist_km is None else max(0.0, min(100.0, (1.0 - (coast_dist_km / 80.0)) * 100.0))
        surge_norm = coast_norm * 0.9 if coast_norm is not None else None
        rain_norm = cls.normalize_rainfall(rain_24h_mm=rainfall_val)

        indicators = [
            ("Sustained Gale Wind Force", wind_norm, 0.40, "IMD Cyclone Warning Centre, Mumbai"),
            ("Arabian Sea Coastal Setback (<30 km)", coast_norm, 0.30, "National Coastal Zone Management"),
            ("Storm Surge Inundation Vulnerability", surge_norm, 0.20, "INCOIS Coastal Storm Surge Model"),
            ("Peripheral Heavy Rainfall Bands", rain_norm, 0.10, "IMD Doppler Weather Radar")
        ]
        return cls._aggregate_hazard_result("cyclone", indicators)

    # --------------------------------------------------------------------------
    # 5. EARTHQUAKE HAZARD MODEL
    # BIS Zone Factor (40%) + Fault Proximity (30%) + Soil Amplification (20%) + History (10%)
    # --------------------------------------------------------------------------
    @classmethod
    def calculate_earthquake_hazard(
        cls,
        fault_dist_km: Optional[float] = 12.0,
        seismic_zone: int = 4, # BIS Zone III / IV for Koyna-Warna belt
        past_tremors: int = 4
    ) -> Dict[str, Any]:
        bis_norm = 90.0 if seismic_zone >= 5 else 75.0 if seismic_zone == 4 else 50.0 if seismic_zone == 3 else 25.0
        fault_norm = None if fault_dist_km is None else max(0.0, min(100.0, (1.0 - (fault_dist_km / 35.0)) * 100.0))
        soil_amp_norm = 65.0 # Medium stiffness overburden
        hist_norm = min(100.0, (past_tremors / 5.0) * 100.0)

        indicators = [
            ("BIS Seismic Zone Factor (IS 1893:2016)", bis_norm, 0.40, "Bureau of Indian Standards / NCS"),
            ("Active Crustal Fault & Scarp Lineament", fault_norm, 0.30, "Geological Survey of India (Bhukosh)"),
            ("Alluvial Soil Motion Amplification", soil_amp_norm, 0.20, "National Geotechnical Baseline"),
            ("Historical Koyna-Warna Tremor Catalog", hist_norm, 0.10, "National Centre for Seismology (NCS)")
        ]
        return cls._aggregate_hazard_result("earthquake", indicators)

    # --------------------------------------------------------------------------
    # Generic Aggregation & Missing Data Handling
    # --------------------------------------------------------------------------
    @classmethod
    def _aggregate_hazard_result(cls, disaster_type: str, indicators: List[tuple]) -> Dict[str, Any]:
        breakdown: List[RiskIndicatorBreakdown] = []
        missing = []
        avail_weight = 0.0
        weighted_sum = 0.0

        for name, norm_val, weight, dataset in indicators:
            avail = norm_val is not None
            if avail:
                avail_weight += weight
                weighted_sum += norm_val * weight
            else:
                missing.append(name)

            breakdown.append(RiskIndicatorBreakdown(
                indicator=name,
                raw_value=norm_val,
                unit="score (0-100)" if avail else "N/A",
                normalized_score=round(norm_val, 2) if avail else None,
                weight=weight,
                contribution=round(norm_val * weight, 2) if avail else 0.0,
                source_dataset=dataset,
                data_available=avail
            ))

        confidence = (len(indicators) - len(missing)) / len(indicators)

        if avail_weight == 0.0 or len(missing) == len(indicators):
            return {
                "hazard_score": 0.0,
                "status": "insufficient_data",
                "confidence": 0.0,
                "missing": missing,
                "breakdown": breakdown,
                "disaster_type": disaster_type
            }

        score = min(100.0, max(0.0, weighted_sum / avail_weight))
        return {
            "hazard_score": round(score, 2),
            "status": "validated" if not missing else "partial",
            "confidence": round(confidence, 2),
            "missing": missing,
            "breakdown": breakdown,
            "disaster_type": disaster_type
        }

    @classmethod
    def calculate_hazard_by_type(cls, disaster_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        d = disaster_type.lower()
        if "flood" in d:
            return cls.calculate_flood_hazard(
                rainfall_val=data.get("rainfall_val"),
                river_dist_km=data.get("river_dist_km"),
                slope_deg=data.get("slope_deg"),
                past_incidents=data.get("past_incidents"),
                is_24h_rain=data.get("is_24h_rain", False)
            )
        if "drought" in d:
            return cls.calculate_drought_hazard(
                rainfall_val=data.get("rainfall_val"),
                temperature_c=data.get("temperature_c", 35.0),
                soil_moisture_pct=data.get("soil_moisture_pct", 18.0)
            )
        if "cyclone" in d:
            return cls.calculate_cyclone_hazard(
                wind_speed_kmh=data.get("wind_speed_kmh", 95.0),
                coast_dist_km=data.get("coast_dist_km", 18.0),
                rainfall_val=data.get("rainfall_val")
            )
        if "earthquake" in d:
            return cls.calculate_earthquake_hazard(
                fault_dist_km=data.get("fault_dist_km", 14.0),
                seismic_zone=data.get("seismic_zone", 4),
                past_tremors=data.get("past_tremors", 3)
            )
        # Default: Landslide
        return cls.calculate_landslide_hazard(
            rainfall_val=data.get("rainfall_val"),
            slope_deg=data.get("slope_deg"),
            past_incidents=data.get("past_incidents"),
            river_dist_km=data.get("river_dist_km"),
            is_24h_rain=data.get("is_24h_rain", False)
        )

    @classmethod
    def calculate_vulnerability_score(
        cls,
        elderly_pct: float = 14.0,
        disabled_pct: float = 3.0,
        bpl_pct: float = 40.0,
        kutcha_house_pct: float = 60.0,
        healthcare_dist_km: float = 12.0
    ) -> float:
        w_eld = min(100.0, (elderly_pct / 35.0) * 100.0) * 0.20
        w_dis = min(100.0, (disabled_pct / 10.0) * 100.0) * 0.15
        w_bpl = min(100.0, bpl_pct) * 0.20
        w_kutch = min(100.0, kutcha_house_pct) * 0.25
        w_health = min(100.0, (healthcare_dist_km / 25.0) * 100.0) * 0.20
        return round(min(100.0, max(0.0, w_eld + w_dis + w_bpl + w_kutch + w_health)), 2)

    @classmethod
    def calculate_exposure_score(cls, population: int, households: int) -> float:
        score_hh = min(100.0, (households / 150.0) * 100.0) * 0.60
        score_pop = min(100.0, (population / 600.0) * 100.0) * 0.40
        return round(min(100.0, max(0.0, score_hh + score_pop)), 2)

    @classmethod
    def compute_full_risk(
        cls,
        rainfall_val: Optional[float],
        slope_deg: Optional[float],
        past_incidents: Optional[int],
        river_dist_km: Optional[float],
        population: int = 250,
        households: int = 50,
        disaster_type: str = "landslide",
        vulnerability_factors: Optional[Dict[str, float]] = None,
        is_24h_rain: bool = False
    ) -> RiskScoreResult:
        haz_res = cls.calculate_hazard_by_type(disaster_type, {
            "rainfall_val": rainfall_val,
            "slope_deg": slope_deg,
            "past_incidents": past_incidents,
            "river_dist_km": river_dist_km,
            "is_24h_rain": is_24h_rain
        })

        vf = vulnerability_factors or {}
        vuln_score = cls.calculate_vulnerability_score(
            elderly_pct=vf.get("elderly_pct", 15.0),
            disabled_pct=vf.get("disabled_pct", 4.0),
            bpl_pct=vf.get("bpl_pct", 45.0),
            kutcha_house_pct=vf.get("kutcha_house_pct", 65.0),
            healthcare_dist_km=vf.get("healthcare_dist_km", 14.0)
        )
        exp_score = cls.calculate_exposure_score(population, households)

        ow = settings.DEFAULT_OVERALL_WEIGHTS
        overall_score = (
            (haz_res["hazard_score"] * ow["hazard_weight"]) +
            (vuln_score * ow["vulnerability_weight"]) +
            (exp_score * ow["exposure_weight"])
        )
        overall_score = round(min(100.0, max(0.0, overall_score)), 2)
        meta = classify_risk_score(overall_score)

        return RiskScoreResult(
            score=overall_score,
            category=meta["category"],
            color_hex=meta["color_hex"],
            category_code=meta["category_code"],
            hazard_score=haz_res["hazard_score"],
            vulnerability_score=vuln_score,
            exposure_score=exp_score,
            status=haz_res["status"],
            confidence_score=haz_res["confidence"],
            missing_indicators=haz_res["missing"],
            breakdown=haz_res["breakdown"]
        )
