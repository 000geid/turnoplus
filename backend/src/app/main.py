from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_v1_router


def create_app() -> FastAPI:
    app = FastAPI(title="TurnoPlus API", version="0.1.0")

    # CORS configuration - allowing all origins for development
    # In production, this should be restricted to specific domains
    allowed_origins = [
        "http://localhost:4200",      # Angular CLI default
        "http://127.0.0.1:4200",     # Angular CLI default
        "http://localhost:5173",     # Vite default
        "http://127.0.0.1:5173",     # Vite default
        "http://localhost:8080",     # Common alternative port
        "http://127.0.0.1:8080",     # Common alternative port
        "http://localhost:3000",     # Create React App default
        "http://127.0.0.1:3000",     # Create React App default
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        allow_origin_regex="http://localhost:[0-9]+"  # Allow any localhost port
    )

    @app.get("/healthz")
    def healthz():
        return {"status": "ok"}

    app.include_router(api_v1_router, prefix="/api/v1")
    return app


app = create_app()