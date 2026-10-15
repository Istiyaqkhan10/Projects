from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    room_name: str = Field(default="Living Room", min_length=1, max_length=255)
    room_width_m: float = Field(default=5.0, gt=0)
    room_length_m: float = Field(default=4.0, gt=0)
    room_height_m: float = Field(default=2.8, gt=0)


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None


class RoomCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    width_m: float = Field(..., gt=0)
    length_m: float = Field(..., gt=0)
    height_m: float = Field(..., gt=0)


class RoomUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    width_m: float | None = Field(None, gt=0)
    length_m: float | None = Field(None, gt=0)
    height_m: float | None = Field(None, gt=0)


class RoomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    project_id: str
    name: str
    width_m: float
    length_m: float
    height_m: float
    created_at: datetime
    updated_at: datetime


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    owner_id: str | None = None
    name: str
    description: str | None = None
    created_at: datetime
    updated_at: datetime
    rooms: list[RoomResponse] = Field(default_factory=list)


class ProjectDetailResponse(ProjectResponse):
    current_scene_revision: int = 1
