
from fastapi import APIRouter
from pydantic import BaseModel

from app.schemas.scene import CanonicalScene
from app.services.geometry import validate_scene_geometry

router = APIRouter()


class GeometryValidationResult(BaseModel):
    is_valid: bool
    errors: list[str]


@router.post("/validate", response_model=GeometryValidationResult)
async def validate_scene(scene: CanonicalScene) -> GeometryValidationResult:
    """
    Authoritative backend geometry validation.
    Checks positive room/furniture dimensions and boundary containment.
    """
    is_valid, errors = validate_scene_geometry(scene)
    return GeometryValidationResult(is_valid=is_valid, errors=errors)
