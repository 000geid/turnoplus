from fastapi import FastAPI

from app.api.v1 import api_v1_router


def create_app() -> FastAPI:
    app = FastAPI(title="TurnoPlus API", version="0.1.0")

    @app.get("/healthz")
    def healthz():
        return {"status": "ok"}

    app.include_router(api_v1_router, prefix="/api/v1")
    return app


app = create_app()

