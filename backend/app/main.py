import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .api import api_router
from .core.config import settings
from .core.database import engine
from .models import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup():
        # Create tables if they do not exist yet. For a real production system
        # this would be handled by migrations (e.g. Alembic), but auto-create
        # keeps the assessment setup to a single `docker compose up`.
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables ensured.")

    @app.get("/api/health", tags=["health"])
    def health():
        """Liveness probe used by hosting platforms and docker healthchecks."""
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return {"status": "ok", "database": "connected"}
        except Exception as exc:  # pragma: no cover
            return {"status": "degraded", "database": str(exc)}

    @app.get("/", tags=["health"])
    def root():
        return {"service": settings.app_name, "docs": "/docs", "health": "/api/health"}

    app.include_router(api_router)
    return app


app = create_app()
