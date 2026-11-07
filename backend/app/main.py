import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import settings
from app.database import db_manager
from app.services.data_seeder import seed_database_if_empty
from app.routers import auth, gis, risk, dashboard, relocation, regions, climate
from app.rate_limiter import RateLimitMiddleware, rate_limiter, get_client_ip

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("nivaran.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB and seed verified datasets & 18 collections
    logger.info("Starting NIVARAN GIS Backend Service with Secure Rate Limiting...")
    db_manager.connect()
    seed_database_if_empty()
    logger.info("NIVARAN Database and Spatial Services Ready.")
    yield
    # Shutdown
    logger.info("Shutting down NIVARAN GIS Backend Service...")
    db_manager.close()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Enterprise National Disaster Risk Assessment, GIS Analysis & Relocation Platform API",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# 1. SECURITY HEADERS MIDDLEWARE
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# 2. PROPER SECURE RATE LIMITING MIDDLEWARE
app.add_middleware(RateLimitMiddleware)

# 3. WORKABLE EVERY-ORIGIN CORS (Universal Origin Support with Credentials)
# Uses regex allow_origin_regex to reliably support ANY origin (localhost, 127.0.0.1, LAN IPs, staging, production)
# while strictly fulfilling W3C credentialed access rules!
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
        "Retry-After",
    ],
)

# Register All API Routers under /api
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(gis.router, prefix=settings.API_V1_STR)
app.include_router(risk.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(relocation.router, prefix=settings.API_V1_STR)
app.include_router(regions.router, prefix=settings.API_V1_STR)
app.include_router(climate.router, prefix=settings.API_V1_STR)

@app.get("/")
@app.get("/api")
@app.get("/api/")
def root_status(request: Request):
    client_ip = get_client_ip(request)
    return {
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "security": {
            "rate_limiting": "ACTIVE (Tiered Sliding-Window: Auth 20/m, Write 60/m, Read 150/m)",
            "cors_policy": "UNIVERSAL (All HTTP/HTTPS Origins Allowed with Credentials)",
            "security_headers": "ENFORCED (nosniff, SAMEORIGIN, strict-referrer)",
            "client_ip": client_ip,
        },
        "database": {
            "name": settings.MONGODB_DATABASE,
            "connected_to_live_mongo": db_manager.is_connected_to_real_mongo,
            "engine": "MongoDB Atlas / Local" if db_manager.is_connected_to_real_mongo else "Resilient Memory Database (Fallback Active)"
        },
        "docs_url": "/api/docs"
    }

@app.get("/api/health")
def health_check(request: Request):
    client_ip = get_client_ip(request)
    return {
        "status": "healthy",
        "live_mongo": db_manager.is_connected_to_real_mongo,
        "api_version": settings.VERSION,
        "rate_limiting": "enabled",
        "client_ip": client_ip
    }

@app.get("/api/rate-limit/status")
def get_rate_limit_status(request: Request):
    """Returns current rate limit quota and security metrics for the calling client IP."""
    client_ip = get_client_ip(request)
    return {
        "client_ip": client_ip,
        "rate_limit_tiers": {
            "auth": {"limit_per_minute": RateLimitMiddleware.LIMIT_AUTH, "scope": "Login & Registration"},
            "write": {"limit_per_minute": RateLimitMiddleware.LIMIT_WRITE, "scope": "Data Mutations & Ingestions"},
            "read": {"limit_per_minute": RateLimitMiddleware.LIMIT_READ, "scope": "GIS Queries & Telemetry"},
            "health": {"limit_per_minute": RateLimitMiddleware.LIMIT_HEALTH, "scope": "Uptime Monitoring"},
        },
        "policy": "RFC 6585 & RFC 7231 Sliding Window with Retry-After Header",
        "status": "HEALTHY_AND_ENFORCED"
    }
