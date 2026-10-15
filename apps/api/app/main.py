from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.ai_proposals import router as ai_proposals_router
from app.api.routes.catalog import router as catalog_router
from app.api.routes.estimates import router as estimates_router
from app.api.routes.health import router as health_router
from app.api.routes.projects import router as projects_router
from app.api.routes.reports import router as reports_router
from app.api.routes.room_enhancement import router as room_enhancement_router
from app.api.routes.scenes import router as scenes_router
from app.core.config import settings
from app.db.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    await init_db()
    yield


def get_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
        description="InteriorAI Studio — Production-Minded AI Interior Design Platform for the Indian Market",
        lifespan=lifespan,
    )

    # CORS configuration
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Restricted in production environments
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Top-level health check endpoint (as specified in Section 8)
    application.include_router(health_router, tags=["health"])

    # Versioned API routes (/api/v1)
    application.include_router(health_router, prefix=settings.API_V1_STR, tags=["health"])
    application.include_router(projects_router, prefix=f"{settings.API_V1_STR}/projects", tags=["projects"])
    application.include_router(catalog_router, prefix=f"{settings.API_V1_STR}/catalog", tags=["catalog"])
    application.include_router(scenes_router, prefix=f"{settings.API_V1_STR}/scenes", tags=["scenes"])
    application.include_router(estimates_router, prefix=settings.API_V1_STR, tags=["estimates"])
    application.include_router(ai_proposals_router, prefix=f"{settings.API_V1_STR}/projects", tags=["ai-proposals"])
    application.include_router(reports_router, prefix=f"{settings.API_V1_STR}/projects", tags=["reports"])
    application.include_router(room_enhancement_router, prefix=f"{settings.API_V1_STR}/projects", tags=["room-enhancement"])

    return application


app = get_application()
