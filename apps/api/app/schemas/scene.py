from typing import List, Literal
from pydantic import BaseModel, Field, field_validator


class RoomDimensions(BaseModel):
    width_m: float = Field(..., gt=0, description="Room width along the X axis in meters")
    length_m: float = Field(..., gt=0, description="Room length along the Z axis in meters")
    height_m: float = Field(..., gt=0, description="Room ceiling height along the Y axis in meters")


class ObjectPosition(BaseModel):
    x_m: float = Field(..., description="Center X position on floor plane in meters")
    y_m: float = Field(default=0.0, description="Vertical Y elevation in meters (0 for floor)")
    z_m: float = Field(..., description="Center Z position on floor plane in meters")


class ObjectDimensions(BaseModel):
    width_m: float = Field(..., gt=0, description="Furniture width along primary local axis in meters")
    depth_m: float = Field(..., gt=0, description="Furniture depth along secondary local axis in meters")
    height_m: float = Field(..., gt=0, description="Furniture height in meters")


class SceneObject(BaseModel):
    instance_id: str = Field(..., min_length=1, description="Unique scene instance identifier")
    catalog_item_id: str = Field(..., min_length=1, description="Catalog reference ID")
    position: ObjectPosition
    rotation_y_deg: float = Field(default=0.0, description="Rotation around vertical Y axis in degrees")
    dimensions: ObjectDimensions

    @field_validator("rotation_y_deg")
    @classmethod
    def normalize_rotation(cls, v: float) -> float:
        # Normalize to [0, 360)
        return v % 360.0


class CanonicalScene(BaseModel):
    schema_version: int = Field(default=1, ge=1)
    units: Literal["m"] = "m"
    room: RoomDimensions
    objects: List[SceneObject] = Field(default_factory=list)


class SceneUpdatePayload(BaseModel):
    expected_revision: int = Field(..., ge=1, description="Current revision expected by the client")
    scene: CanonicalScene


class SceneResponse(BaseModel):
    project_id: str
    room_id: str
    revision: int
    schema_version: int
    scene: CanonicalScene
