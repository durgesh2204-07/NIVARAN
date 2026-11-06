import os
from typing import Dict, Any
from pydantic import BaseModel

class RiskThreshold(BaseModel):
    min_score: float
    max_score: float
    category: str
    color_hex: str
    description: str

class Settings:
    # Service Information
    APP_NAME: str = "NIVARAN Disaster Early Warning & GIS Relocation Engine"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"

    # Database Configuration
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DATABASE: str = os.getenv("MONGODB_DATABASE", "nivaran")

    # Security & JWT Configuration
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "nivaran-secure-super-secret-key-32-bytes-min-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Initial Admin Bootstrap (can be overridden via ENV)
    INITIAL_ADMIN_EMAIL: str = os.getenv("INITIAL_ADMIN_EMAIL", "admin@nivaran.gov.in")
    INITIAL_ADMIN_PASSWORD: str = os.getenv("INITIAL_ADMIN_PASSWORD", "Nivaran@Admin2026")
    INITIAL_ADMIN_NAME: str = os.getenv("INITIAL_ADMIN_NAME", "Dr. Rajeshwar Deshmukh, IAS")
    INITIAL_ADMIN_ROLE: str = "Administrator"

    # CORS Allowed Origins
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:8000",
        "*"
    ]

    # Standard Configurable 0-100 Risk Categories & Colors (Exact boundaries per Part 1)
    RISK_CATEGORIES: Dict[str, Dict[str, Any]] = {
        "VERY_HIGH": {
            "name": "Very High Risk",
            "min": 80.0,
            "max": 100.0,
            "color": "#DC2626", # RED
            "code": "RED",
            "action": "Immediate Pre-Monsoon Evacuation & Permanent Relocation"
        },
        "HIGH": {
            "name": "High Risk",
            "min": 60.0,
            "max": 80.0, # 60.0 to < 80.0
            "color": "#EAB308", # YELLOW
            "code": "YELLOW",
            "action": "Strict Vigilance, Structural Mitigation & Phase-2 Relocation Planning"
        },
        "MODERATE": {
            "name": "Moderate Risk",
            "min": 40.0,
            "max": 60.0, # 40.0 to < 60.0
            "color": "#F97316", # ORANGE
            "code": "ORANGE",
            "action": "Active Seasonal Telemetry Monitoring & Safe Drainage Works"
        },
        "LOW": {
            "name": "Low Risk",
            "min": 20.0,
            "max": 40.0, # 20.0 to < 40.0
            "color": "#84CC16", # LIGHT GREEN
            "code": "LIGHT_GREEN",
            "action": "Periodic Ground Truth Surveys & Habitability Maintenance"
        },
        "VERY_LOW": {
            "name": "Very Low Risk",
            "min": 0.0,
            "max": 20.0, # 0.0 to < 20.0
            "color": "#16A34A", # GREEN
            "code": "GREEN",
            "action": "Designated Safe Host Plateau / No Active Threat Detected"
        }
    }

    # Initial Hazard Indicator Weights (Part 1 - Configurable by Analysts)
    DEFAULT_HAZARD_WEIGHTS: Dict[str, float] = {
        "rainfall_risk": 0.35,
        "slope_risk": 0.30,
        "history_risk": 0.20,
        "river_proximity_risk": 0.15
    }

    # Default Overall Risk Weights
    DEFAULT_OVERALL_WEIGHTS: Dict[str, float] = {
        "hazard_weight": 0.50,
        "vulnerability_weight": 0.30,
        "exposure_weight": 0.20
    }

settings = Settings()

