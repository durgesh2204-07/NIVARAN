"""
NIVARAN GIS 2.0 - Vercel Multi-Service Entrypoint for FastAPI Backend
"""
import os
import sys

# Ensure backend root directory is in python sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

# Expose 'app' ASGI callable for Vercel Serverless / Services Runtime
__all__ = ["app"]

