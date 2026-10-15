from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    room_name: str = Field(default="Living Room", min_length=1, max_length=255)
    room_width_m: float = Field(default=5.0, gt=0)
    room_length_m: float = Field(default=4.0, gt=0)
    room_height_m: float = Field(default=2.8, gt=0)


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None


class RoomCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    width_m: float = Field(..., gt=0)
    length_m: float = Field(..., gt=0)
    height_m: float = Field(..., gt=0)


class RoomUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    width_m: Optional[float] = Field(None, gt=0)
    length_m: Optional[float] = Field(None, gt=0)
    height_m: Optional[float] = Field(None, gt=0)


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
    owner_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    rooms: List[RoomResponse] = Field(default_factory=list)


class ProjectDetailResponse(ProjectResponse):
    current_scene_revision: int = 1
