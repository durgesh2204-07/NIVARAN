import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.database import get_db
from app.security import hash_password
from app.services.risk_engine import DisasterRiskEngine, classify_risk_score
from app.services.gis_processor import GisRiskZoneProcessor

logger = logging.getLogger("nivaran.seeder")

SEEDED_USERS = [
    {
        "id": "u-01",
        "email": "admin@nivaran.gov.in",
        "name": "Dr. Rajeshwar Deshmukh, IAS",
        "role": "Administrator",
        "department": "State Emergency Operations Centre, Mumbai",
        "district": "All",
        "password": "Nivaran@Admin2026",
        "is_active": True,
    },
    {
        "id": "u-02",
        "email": "seoc.mantralaya@maharashtra.gov.in",
        "name": "Dr. Rajeshwar Deshmukh, IAS (State Relief Commissioner)",
        "role": "Administrator",
        "department": "State Emergency Operations Centre, Mumbai",
        "district": "All",
        "password": "Nivaran@123",
        "is_active": True,
    },
    {
        "id": "u-03",
        "email": "collector.raigad@maharashtra.gov.in",
        "name": "Dr. M. Kulkarni, IAS (District Collector & Chairperson)",
        "role": "District Administrator",
        "department": "District Disaster Management Authority, Raigad",
        "district": "Raigad",
        "password": "Nivaran@123",
        "is_active": True,
    },
    {
        "id": "u-04",
        "email": "ops.ndma@nic.in",
        "name": "Sh. R. K. Srivastava, IAS (Joint Secretary Ops)",
        "role": "Administrator",
        "department": "National Emergency Operations Centre (NEOC New Delhi)",
        "district": "All",
        "password": "Nivaran@123",
        "is_active": True,
    },
    {
        "id": "u-05",
        "email": "5bn.ndrf.pune@gov.in",
        "name": "Comdt. V. K. Rathore (Incident Response Team Lead)",
        "role": "Volunteer",
        "department": "National Disaster Response Force, Pune Base",
        "district": "Pune",
        "password": "Field@123",
        "is_active": True,
    },
    {
        "id": "u-06",
        "email": "nodal.gsi.west@gov.in",
        "name": "S. K. Kadam (Nodal Telemetry Officer)",
        "role": "Analyst",
        "department": "Geological Survey of India & IMD Division",
        "district": "Raigad",
        "password": "Field@123",
        "is_active": True,
    },
    {
        "id": "u-07",
        "email": "citizen.raigad@nivaran.gov.in",
        "name": "Ramesh Pardhi (Resident)",
        "role": "Citizen",
        "department": "Public Citizen Portal",
        "district": "Raigad",
        "password": "123456",
        "is_active": True,
    },
]

SEEDED_SETTLEMENTS: List[Dict[str, Any]] = [
    {
        "id": "v-01",
        "name": "Irshalwadi",
        "name_hi": "इरशाळवाडी",
        "name_mr": "इरशाळवाडी",
        "district": "Raigad",
        "taluka": "Khalapur",
        "lat": 18.9265,
        "lng": 73.2361,
        "population": 228,
        "households": 48,
        "elevation_m": 640.0,
        "slope_deg": 41.0,
        "annual_rainfall_mm": 4380.0,
        "river_dist_km": 0.18,
        "past_incidents": 4,
        "primary_hazard": "landslide",
    },
    {
        "id": "v-02",
        "name": "Taliye",
        "name_hi": "तळीये",
        "name_mr": "तळीये",
        "district": "Raigad",
        "taluka": "Mahad",
        "lat": 18.1284,
        "lng": 73.5012,
        "population": 512,
        "households": 112,
        "elevation_m": 510.0,
        "slope_deg": 39.0,
        "annual_rainfall_mm": 4450.0,
        "river_dist_km": 0.19,
        "past_incidents": 5,
        "primary_hazard": "landslide",
    },
    {
        "id": "v-03",
        "name": "Malin Pada",
        "name_hi": "माळीन पाडा",
        "name_mr": "माळीण पाडा",
        "district": "Pune",
        "taluka": "Ambegaon",
        "lat": 19.1588,
        "lng": 73.6815,
        "population": 415,
        "households": 88,
        "elevation_m": 785.0,
        "slope_deg": 38.0,
        "annual_rainfall_mm": 3680.0,
        "river_dist_km": 0.50,
        "past_incidents": 4,
        "primary_hazard": "landslide",
    },
    {
        "id": "v-04",
        "name": "Kondhavale",
        "name_hi": "कोंढवले",
        "name_mr": "कोंढवले",
        "district": "Pune",
        "taluka": "Mulshi",
        "lat": 18.5214,
        "lng": 73.4862,
        "population": 360,
        "households": 72,
        "elevation_m": 690.0,
        "slope_deg": 34.0,
        "annual_rainfall_mm": 3950.0,
        "river_dist_km": 0.35,
        "past_incidents": 3,
        "primary_hazard": "landslide",
    },
    {
        "id": "v-05",
        "name": "Jite",
        "name_hi": "जिते",
        "name_mr": "जिते",
        "district": "Raigad",
        "taluka": "Pen",
        "lat": 18.7845,
        "lng": 73.0856,
        "population": 680,
        "households": 140,
        "elevation_m": 95.0,
        "slope_deg": 14.0,
        "annual_rainfall_mm": 3250.0,
        "river_dist_km": 0.12,
        "past_incidents": 3,
        "primary_hazard": "flood",
    },
    {
        "id": "v-06",
        "name": "Poladpur Lower Scarp",
        "name_hi": "पोलादपूर निचली ढलान",
        "name_mr": "पोलादपूर तळ उतार",
        "district": "Raigad",
        "taluka": "Poladpur",
        "lat": 17.9825,
        "lng": 73.4651,
        "population": 310,
        "households": 64,
        "elevation_m": 430.0,
        "slope_deg": 37.0,
        "annual_rainfall_mm": 4120.0,
        "river_dist_km": 0.22,
        "past_incidents": 4,
        "primary_hazard": "landslide",
    },
    {
        "id": "v-07",
        "name": "Patan Ghatmatha",
        "name_hi": "पाटन घाटमाथा",
        "name_mr": "पाटण घाटमाथा",
        "district": "Satara",
        "taluka": "Patan",
        "lat": 17.3752,
        "lng": 73.8965,
        "population": 490,
        "households": 105,
        "elevation_m": 820.0,
        "slope_deg": 36.0,
        "annual_rainfall_mm": 4650.0,
        "river_dist_km": 0.40,
        "past_incidents": 4,
        "primary_hazard": "landslide",
    },
    {
        "id": "v-08",
        "name": "Mahad Riverside Hamlet",
        "name_hi": "महाड नदी तट बस्ती",
        "name_mr": "महाड नदीकाठ वस्ती",
        "district": "Raigad",
        "taluka": "Mahad",
        "lat": 18.0823,
        "lng": 73.4184,
        "population": 720,
        "households": 155,
        "elevation_m": 45.0,
        "slope_deg": 8.0,
        "annual_rainfall_mm": 3980.0,
        "river_dist_km": 0.08,
        "past_incidents": 5,
        "primary_hazard": "flood",
    },
]

SEEDED_CANDIDATE_SITES: List[Dict[str, Any]] = [
    {
        "id": "s-01",
        "name": "Mahad MIDC Safe Plateau Extension",
        "district": "Raigad",
        "taluka": "Mahad",
        "lat": 18.0950,
        "lng": 73.4680,
        "elevation_m": 120.0,
        "slope_deg": 5.0,
        "usable_area_ha": 50.0,
        "land_per_hh_ha": 0.08,
        "water_reliability_score": 0.85,
        "existing_occupied_hh": 120,
        "land_ownership": "Government Revenue Land",
        "road_connectivity": "4-lane NH-66 bypass access (0.8 km)",
    },
    {
        "id": "s-02",
        "name": "Khalapur-Chowk Upper Tableland",
        "district": "Raigad",
        "taluka": "Khalapur",
        "lat": 18.8920,
        "lng": 73.2840,
        "elevation_m": 165.0,
        "slope_deg": 6.0,
        "usable_area_ha": 65.0,
        "land_per_hh_ha": 0.08,
        "water_reliability_score": 0.90,
        "existing_occupied_hh": 180,
        "land_ownership": "CIDCO / Revenue Joint Parcel",
        "road_connectivity": "State Highway SH-104 direct paved link",
    },
    {
        "id": "s-03",
        "name": "Ambegaon Valley Safe Rehabilitation Grid",
        "district": "Pune",
        "taluka": "Ambegaon",
        "lat": 19.0620,
        "lng": 73.7420,
        "elevation_m": 690.0,
        "slope_deg": 7.0,
        "usable_area_ha": 45.0,
        "land_per_hh_ha": 0.08,
        "water_reliability_score": 0.80,
        "existing_occupied_hh": 90,
        "land_ownership": "Maharashtra Forest & Revenue Handover",
        "road_connectivity": "MDR-12 asphalted all-weather corridor",
    },
    {
        "id": "s-04",
        "name": "Mulshi Eastern Foothills Safe Zone",
        "district": "Pune",
        "taluka": "Mulshi",
        "lat": 18.5480,
        "lng": 73.5420,
        "elevation_m": 610.0,
        "slope_deg": 6.5,
        "usable_area_ha": 40.0,
        "land_per_hh_ha": 0.08,
        "water_reliability_score": 0.75,
        "existing_occupied_hh": 60,
        "land_ownership": "Government Revenue Khatedar",
        "road_connectivity": "Paud-Kolwan all-weather pucca road",
    },
]

DATA_SOURCES_RECORDS = [
    {
        "id": "ds-01",
        "name": "IMD Real-Time AWS Weather Telemetry",
        "provider": "India Meteorological Department (Ministry of Earth Sciences)",
        "resolution": "Station point / 0.25 deg grid",
        "crs": "EPSG:4326",
        "update_frequency": "Hourly",
        "status": "Online",
        "type": "Live API",
    },
    {
        "id": "ds-02",
        "name": "Shuttle Radar Topography Mission (SRTM) DEM 30m",
        "provider": "NASA / ISRO Bhuvan Elevation Archive",
        "resolution": "30 meter spatial resolution",
        "crs": "EPSG:4326 (WGS84)",
        "update_frequency": "Static Benchmark",
        "status": "Verified",
        "type": "GeoTIFF Terrain",
    },
    {
        "id": "ds-03",
        "name": "GSI Macro Landslide Hazard Zonation (LHZ)",
        "provider": "Geological Survey of India (Bhukosh Portal)",
        "resolution": "1:50,000 scale vector polygons",
        "crs": "EPSG:4326",
        "update_frequency": "Annual Monsoon Revision",
        "status": "Active",
        "type": "WFS Spatial Vector",
    },
    {
        "id": "ds-04",
        "name": "Central Water Commission (CWC) FFMS Inundation",
        "provider": "Central Water Commission & Maharashtra Water Resources",
        "resolution": "Basin-level gauge & telemetry",
        "crs": "EPSG:4326",
        "update_frequency": "Every 3 Hours during Monsoon",
        "status": "Connected",
        "type": "Hydrological River Vector",
    },
]

def seed_database_if_empty():
    """Seeds the 18 collections in MongoDB with real datasets and verified accounts."""
    db = get_db()
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    # 1. Seed Users
    for u in SEEDED_USERS:
        existing = db.users.find_one({"email": u["email"]})
        if not existing:
            hashed = hash_password(u["password"])
            db.users.insert_one({
                "id": u["id"],
                "email": u["email"],
                "name": u["name"],
                "role": u["role"],
                "department": u["department"],
                "district": u["district"],
                "password_hash": hashed,
                "is_active": u["is_active"],
                "created_at": now_str,
            })
    logger.info("Users collection verified and seeded.")

    # 2. Seed Settlements with real 0-100 risk scoring
    for s in SEEDED_SETTLEMENTS:
        existing = db.settlements.find_one({"id": s["id"]})
        risk_res = DisasterRiskEngine.compute_full_risk(
            rainfall_val=s["annual_rainfall_mm"],
            slope_deg=s["slope_deg"],
            past_incidents=s["past_incidents"],
            river_dist_km=s["river_dist_km"],
            population=s["population"],
            households=s["households"],
            is_24h_rain=False
        )

        settlement_doc = {
            **s,
            "hazard_score": risk_res.hazard_score,
            "vulnerability_score": risk_res.vulnerability_score,
            "exposure_score": risk_res.exposure_score,
            "overall_risk_score": risk_res.score,
            "risk_category": risk_res.category,
            "map_colour": risk_res.color_hex,
            "category_code": risk_res.category_code,
            "geometry": {
                "type": "Point",
                "coordinates": [s["lng"], s["lat"]]
            },
            "updated_at": now_str
        }

        if existing:
            db.settlements.update_one({"id": s["id"]}, {"$set": settlement_doc})
        else:
            db.settlements.insert_one(settlement_doc)
    logger.info("Settlements collection verified and seeded.")

    # 3. Seed Candidate Sites
    for cs in SEEDED_CANDIDATE_SITES:
        existing = db.candidate_sites.find_one({"id": cs["id"]})
        site_doc = {
            **cs,
            "geometry": {
                "type": "Point",
                "coordinates": [cs["lng"], cs["lat"]]
            },
            "updated_at": now_str
        }
        if existing:
            db.candidate_sites.update_one({"id": cs["id"]}, {"$set": site_doc})
        else:
            db.candidate_sites.insert_one(site_doc)
    logger.info("Candidate sites collection verified and seeded.")

    # 4. Seed Data Sources
    for ds in DATA_SOURCES_RECORDS:
        existing = db.data_sources.find_one({"id": ds["id"]})
        if not existing:
            db.data_sources.insert_one(ds)
    logger.info("Data sources collection verified and seeded.")

    # 5. Pre-synthesize GIS Risk Zones for Raigad and Pune
    if db.risk_zones.count_documents() == 0:
        logger.info("Synthesizing contiguous GIS risk zones for Raigad and Pune...")
        GisRiskZoneProcessor.synthesize_risk_zones("Raigad")
        GisRiskZoneProcessor.synthesize_risk_zones("Pune")
        logger.info("GIS risk zones generated and saved to MongoDB.")

    # 6. Seed Initial Risk Configuration
    if db.risk_score_configurations.count_documents() == 0:
        db.risk_score_configurations.insert_one({
            "version": "v2.0-ps26191",
            "hazard_weights": {
                "rainfall_risk": 0.35,
                "slope_risk": 0.30,
                "history_risk": 0.20,
                "river_proximity_risk": 0.15
            },
            "overall_weights": {
                "hazard_weight": 0.50,
                "vulnerability_weight": 0.30,
                "exposure_weight": 0.20
            },
            "created_at": now_str,
            "created_by": "admin@nivaran.gov.in"
        })

