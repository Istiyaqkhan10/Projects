from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.scene import ObjectDimensions, ObjectPosition


class AILayoutRequest(BaseModel):
    prompt: str | None = Field(
        None,
        description="User preference or prompt describing desired layout.",
        max_length=500,
    )
    room_type: str | None = Field(
        "living_room",
        description="Type of room: living_room, bedroom, or home_office.",
    )
    preferred_item_ids: list[str] | None = Field(
        None,
        description="Optional list of catalog item IDs to prioritize.",
    )


class SuggestedObject(BaseModel):
    catalog_item_id: str
    item_name: str
    position: ObjectPosition
    rotation_y_deg: float = 0.0
    dimensions: ObjectDimensions


class AILayoutProposalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    base_scene_revision: int
    request_parameters: dict[str, Any]
    explanation: str
    suggested_objects: list[SuggestedObject]
    validation_status: str
    validation_errors: list[str] = []
    created_at: datetime


class ApplyProposalRequest(BaseModel):
    expected_revision: int = Field(
        ...,
        description="Current scene revision that the client expects to replace.",
        ge=1,
    )
