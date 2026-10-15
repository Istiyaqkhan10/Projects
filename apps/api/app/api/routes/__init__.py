from app.api.routes.ai_proposals import router as ai_proposals_router
from app.api.routes.catalog import router as catalog_router
from app.api.routes.estimates import router as estimates_router
from app.api.routes.health import router as health_router
from app.api.routes.projects import router as projects_router
from app.api.routes.scenes import router as scenes_router

__all__ = [
    "health_router",
    "catalog_router",
    "projects_router",
    "scenes_router",
    "estimates_router",
    "ai_proposals_router",
]
