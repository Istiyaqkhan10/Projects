from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.ai_layout import SuggestedObject
from app.schemas.scene import RoomStyling


class RoomEnhanceRequest(BaseModel):
    image_base64: str = Field(
        ...,
        description="Base64 encoded room photo (supports data:image/...;base64,... format)",
    )
    style_preference: str | None = Field(
        "Warm Contemporary",
        description="Desired interior style: 'Warm Contemporary', 'Japandi Serenity', 'Coastal Modern', 'Indian Heritage Luxe', 'Minimalist Urban'",
    )
    room_type: str | None = Field(
        "living_room",
        description="Room archetype: living_room, bedroom, home_office",
    )
    preserve_furniture: bool = Field(
        False,
        description="If True, only enhance colors, lighting and materials without replacing furniture",
    )


class ColorSwatch(BaseModel):
    role: str
    name: str
    hex: str


class LightingRecommendation(BaseModel):
    temperature_k: int
    ambient_intensity: float
    directional_intensity: float
    ambiance_name: str
    recommended_fixtures: list[str]


class RoomEnhancementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    theme_title: str
    spatial_analysis: str
    design_rationale: str
    color_palette: list[ColorSwatch]
    lighting: LightingRecommendation
    floor_material: str
    floor_name: str
    styling: RoomStyling
    suggested_furniture: list[SuggestedObject]
    enhanced_visualization_svg: str
    created_at: datetime


class ApplyEnhancementRequest(BaseModel):
    expected_revision: int = Field(..., ge=1, description="Current scene revision")
    apply_colors_and_lighting: bool = Field(
        True, description="Apply wall paints, floor finish, and lighting configuration"
    )
    apply_furniture: bool = Field(
        True, description="Apply the AI-curated furniture layout"
    )
    enhancement_id: str | None = None
    styling_payload: RoomStyling | None = None
    suggested_objects: list[SuggestedObject] | None = None
