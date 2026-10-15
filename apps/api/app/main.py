from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.catalog import router as catalog_router
from app.api.routes.health import router as health_router
from app.api.routes.scenes import router as scenes_router
from app.core.config import settings


def get_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
        description="InteriorAI Studio — Production-Minded AI Interior Design Platform for the Indian Market",
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
    application.include_router(catalog_router, prefix=f"{settings.API_V1_STR}/catalog", tags=["catalog"])
    application.include_router(scenes_router, prefix=f"{settings.API_V1_STR}/scenes", tags=["scenes"])

    return application


app = get_application()
