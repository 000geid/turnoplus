from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

from app.api.v1 import api_v1_router
from app.db.settings import get_cors_settings


logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    app = FastAPI(title="TurnoPlus API", version="0.1.0")

    # Get CORS configuration from environment variables
    cors_settings = get_cors_settings()

    # Log warnings for production environments using defaults
    if os.getenv("ENV", "development") == "production":
        if not os.getenv("CORS_ORIGINS"):
            logger.warning(
                "Production environment detected but CORS_ORIGINS not set. "
                "Using default origins which may not be secure for production."
            )

    # Add CORS middleware with environment-based configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_settings.origins,
        allow_credentials=cors_settings.allow_credentials,
        allow_methods=cors_settings.allow_methods,
        allow_headers=cors_settings.allow_headers,
        allow_origin_regex=cors_settings.origin_regex,
    )

    @app.get("/healthz")
    def healthz():
        return {"status": "ok"}

    app.include_router(api_v1_router, prefix="/api/v1")
    return app


app = create_app()
