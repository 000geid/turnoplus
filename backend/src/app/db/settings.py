from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator


load_dotenv()


class DatabaseSettings(BaseModel):
    """Database configuration loaded from environment variables."""

    url: str = Field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL",
            "mysql+pymysql://turnoplus:turnoplus@localhost:3306/turnoplus",
        )
    )
    echo: bool = Field(default_factory=lambda: os.getenv("DATABASE_ECHO", "0") == "1")
    pool_pre_ping: bool = Field(
        default_factory=lambda: os.getenv("DATABASE_POOL_PRE_PING", "1") != "0"
    )
    alembic_ini_path: Path = Field(
        default_factory=lambda: Path(
            os.getenv("ALEMBIC_INI_PATH", Path(__file__).resolve().parents[3] / "alembic.ini")
        )
    )

    @field_validator("url")
    @classmethod
    def _validate_url(cls, value: str) -> str:
        if "://" not in value:
            raise ValueError("DATABASE_URL must be a valid SQLAlchemy connection URL")
        return value


@lru_cache(maxsize=1)
def get_database_settings() -> DatabaseSettings:
    return DatabaseSettings()


class CORSSettings(BaseModel):
    """CORS configuration loaded from environment variables."""

    origins: list[str] = Field(
        default_factory=lambda: CORSSettings._parse_origins(
            os.getenv("CORS_ORIGINS")
        )
    )
    allow_credentials: bool = Field(
        default_factory=lambda: os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true"
    )
    allow_methods: list[str] = Field(
        default_factory=lambda: CORSSettings._parse_list(
            os.getenv("CORS_ALLOW_METHODS", "GET,POST,PUT,DELETE,OPTIONS")
        )
    )
    allow_headers: list[str] = Field(
        default_factory=lambda: CORSSettings._parse_list(
            os.getenv("CORS_ALLOW_HEADERS", "*")
        )
    )
    origin_regex: str | None = Field(
        default_factory=lambda: os.getenv("CORS_ORIGIN_REGEX", "http://localhost:[0-9]+")
    )

    @staticmethod
    def _parse_origins(env_value: str | None) -> list[str]:
        """Parse CORS_ORIGINS environment variable with defaults."""
        if env_value:
            return [origin.strip() for origin in env_value.split(",") if origin.strip()]

        # Default origins based on current hardcoded list
        return [
            "http://localhost:4200",      # Angular CLI default
            "http://127.0.0.1:4200",     # Angular CLI default
            "http://localhost:5173",     # Vite default
            "http://127.0.0.1:5173",     # Vite default
            "http://localhost:8080",     # Common alternative port
            "http://127.0.0.1:8080",     # Common alternative port
            "http://localhost:3000",     # Create React App default
            "http://127.0.0.1:3000",     # Create React App default
            "https://molly-artistic-bat.ngrok-free.app",  # Ngrok tunnel for external access
            "https://backend-tunnel.ogeid.xyz",  # Dedicated backend tunnel
        ]

    @staticmethod
    def _parse_list(env_value: str) -> list[str]:
        """Parse comma-separated environment variable into list."""
        return [item.strip() for item in env_value.split(",") if item.strip()]

    @field_validator("origins")
    @classmethod
    def _validate_origins(cls, value: list[str]) -> list[str]:
        """Validate that origins are properly formatted URLs."""
        for origin in value:
            if origin != "*" and not (origin.startswith("http://") or origin.startswith("https://")):
                raise ValueError(f"Invalid CORS origin: {origin}")
        return value


@lru_cache(maxsize=1)
def get_cors_settings() -> CORSSettings:
    return CORSSettings()


__all__ = ["DatabaseSettings", "get_database_settings", "CORSSettings", "get_cors_settings"]
__all__ = ["DatabaseSettings", "get_database_settings", "CORSSettings", "get_cors_settings"]
