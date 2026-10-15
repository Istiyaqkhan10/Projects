from typing import Literal

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


class LightingScheme(BaseModel):
    temperature_k: int = Field(default=3000, description="Lighting color temperature in Kelvin (2700-6000K)")
    ambient_intensity: float = Field(default=0.7, ge=0.1, le=2.0)
    directional_intensity: float = Field(default=1.0, ge=0.1, le=3.0)
    ceiling_fixtures: list[str] = Field(
        default_factory=lambda: ["cove", "recessed"],
        description="Fixture recommendations: cove, recessed, pendant, floor_lamp",
    )


class RoomStyling(BaseModel):
    wall_color: str = Field(default="#FAF7F2", description="Primary wall paint color (hex)")
    accent_wall_color: str | None = Field(default="#C2410C", description="Focal accent wall paint color (hex)")
    accent_wall_index: int = Field(default=0, ge=0, le=3, description="Wall index: 0=front, 1=back, 2=left, 3=right")
    floor_material: str = Field(
        default="hardwood_teak",
        description="hardwood_teak, oak_parquet, white_marble, kota_stone, polished_concrete",
    )
    lighting: LightingScheme = Field(default_factory=LightingScheme)
    theme_name: str | None = Field(default="Warm Contemporary", description="Interior aesthetic theme name")


class CanonicalScene(BaseModel):
    schema_version: int = Field(default=1, ge=1)
    units: Literal["m"] = "m"
    room: RoomDimensions
    styling: RoomStyling | None = Field(default_factory=RoomStyling)
    objects: list[SceneObject] = Field(default_factory=list)


class SceneUpdatePayload(BaseModel):
    expected_revision: int = Field(..., ge=1, description="Current revision expected by the client")
    scene: CanonicalScene


class SceneResponse(BaseModel):
    project_id: str
    room_id: str
    revision: int
    schema_version: int
    scene: CanonicalScene
