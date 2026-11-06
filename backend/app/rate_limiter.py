"""
NIVARAN DISASTER PLATFORM - SECURE ENTERPRISE RATE LIMITER
Sliding-Window In-Memory Rate Limiter & Security Guard

Protects against:
- Brute-force credential stuffing attacks on authentication endpoints
- Distributed denial-of-service (DDoS) & resource exhaustion on GIS queries
- Automated scraping of sensitive disaster telemetry & spatial records

Features:
- Thread-safe sliding window timestamp tracking per client IP
- Tiered rate limits: Auth (20/min), Mutation (60/min), Read (150/min), Health (300/min)
- Standard HTTP 429 Too Many Requests response with RFC 6585 & RFC 7231 Retry-After header
- RFC RateLimit headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- Automatic garbage collection of expired IP buckets to prevent memory leaks
- Safe reverse-proxy client IP detection (X-Forwarded-For / X-Real-IP)
- Exemption of OPTIONS preflight requests for 100% reliable cross-origin operation
"""

import time
import threading
from typing import Dict, List, Tuple, Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

class SecureRateLimiter:
    """
    Thread-safe in-memory sliding-window rate limiter.
    """
    def __init__(self, window_seconds: int = 60):
        self.window_seconds = window_seconds
        # Structure: { key: [timestamp, timestamp, ...] }
        self._buckets: Dict[str, List[float]] = {}
        self._lock = threading.Lock()
        self._last_cleanup = time.time()

    def _cleanup_expired(self, now: float):
        """Purges buckets with no requests in the current window."""
        cutoff = now - self.window_seconds
        stale_keys = []
        for key, timestamps in self._buckets.items():
            self._buckets[key] = [t for t in timestamps if t > cutoff]
            if not self._buckets[key]:
                stale_keys.append(key)
        for key in stale_keys:
            self._buckets.pop(key, None)
        self._last_cleanup = now

    def check_rate_limit(
        self, client_ip: str, tier_name: str, limit_per_minute: int
    ) -> Tuple[bool, int, int, int]:
        """
        Evaluates whether a client request is allowed under the requested tier.

        Returns:
            (is_allowed, remaining_quota, reset_seconds, limit_per_minute)
        """
        now = time.time()
        bucket_key = f"{client_ip}:{tier_name}"

        with self._lock:
            # Perform periodic garbage collection every 3 minutes
            if now - self._last_cleanup > 180:
                self._cleanup_expired(now)

            cutoff = now - self.window_seconds
            timestamps = self._buckets.get(bucket_key, [])
            # Keep only timestamps within the current sliding window
            timestamps = [t for t in timestamps if t > cutoff]

            count = len(timestamps)
            if count >= limit_per_minute:
                # Quota exceeded. Calculate oldest timestamp expiry
                oldest_in_window = timestamps[0]
                reset_seconds = max(1, int(oldest_in_window + self.window_seconds - now))
                self._buckets[bucket_key] = timestamps
                return False, 0, reset_seconds, limit_per_minute

            # Allow request and append current timestamp
            timestamps.append(now)
            self._buckets[bucket_key] = timestamps
            remaining = max(0, limit_per_minute - len(timestamps))
            oldest_in_window = timestamps[0]
            reset_seconds = max(1, int(oldest_in_window + self.window_seconds - now))

            return True, remaining, reset_seconds, limit_per_minute


# Singleton Instance
rate_limiter = SecureRateLimiter(window_seconds=60)


def get_client_ip(request: Request) -> str:
    """Extracts genuine client IP from proxy headers or socket address."""
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        # First IP in comma-separated list is genuine client
        parts = [p.strip() for p in x_forwarded_for.split(",")]
        if parts and parts[0]:
            return parts[0]

    x_real_ip = request.headers.get("x-real-ip")
    if x_real_ip:
        return x_real_ip.strip()

    if request.client and request.client.host:
        return request.client.host

    return "127.0.0.1"


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI / Starlette Middleware enforcing tiered rate limits across all routes.
    """
    # Tier thresholds (requests per 60-second window)
    LIMIT_AUTH = 20          # /api/auth/login, /api/auth/register (strict anti-brute force)
    LIMIT_WRITE = 60         # POST, PUT, DELETE, PATCH
    LIMIT_READ = 150         # GET /api/... (GIS, Telemetry, History)
    LIMIT_HEALTH = 300       # /api/health, /

    async def dispatch(self, request: Request, call_next) -> Response:
        # Preflight CORS OPTIONS requests must bypass rate limiting for universal browser reliability
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path
        method = request.method
        client_ip = get_client_ip(request)

        # 1. Determine Tier & Limit
        if path.startswith("/api/auth/login") or path.startswith("/api/auth/register"):
            tier = "auth"
            limit = self.LIMIT_AUTH
        elif path == "/api/health" or path == "/":
            tier = "health"
            limit = self.LIMIT_HEALTH
        elif method in ["POST", "PUT", "DELETE", "PATCH"]:
            tier = "write"
            limit = self.LIMIT_WRITE
        else:
            tier = "read"
            limit = self.LIMIT_READ

        # 2. Check Quota
        allowed, remaining, reset_secs, limit_quota = rate_limiter.check_rate_limit(
            client_ip=client_ip,
            tier_name=tier,
            limit_per_minute=limit
        )

        # 3. Handle Exceeded Quota (HTTP 429)
        if not allowed:
            reset_epoch = int(time.time() + reset_secs)
            headers = {
                "Retry-After": str(reset_secs),
                "X-RateLimit-Limit": str(limit_quota),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(reset_epoch),
                "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
                "Access-Control-Allow-Credentials": "true",
            }
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too Many Requests",
                    "detail": f"Secure Rate Limit Exceeded for tier '{tier}'. Please slow down and retry in {reset_secs} seconds.",
                    "tier": tier,
                    "limit_per_minute": limit_quota,
                    "retry_after_seconds": reset_secs,
                },
                headers=headers
            )

        # 4. Proceed With Request
        response = await call_next(request)

        # 5. Attach Informational RateLimit Headers
        reset_epoch = int(time.time() + reset_secs)
        response.headers["X-RateLimit-Limit"] = str(limit_quota)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_epoch)

        return response

