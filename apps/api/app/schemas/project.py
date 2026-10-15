from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    room_name: str = Field(default="Living Room", min_length=1, max_length=255)
    room_width_m: float = Field(default=5.0, gt=0)
    room_length_m: float = Field(default=4.0, gt=0)
    room_height_m: float = Field(default=2.8, gt=0)


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    owner_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class RoomCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    width_m: float = Field(..., gt=0)
    length_m: float = Field(..., gt=0)
    height_m: float = Field(..., gt=0)


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
