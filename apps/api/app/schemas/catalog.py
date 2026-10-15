from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CatalogItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=64)
    manufacturer: Optional[str] = None
    description: Optional[str] = None
    width_m: float = Field(..., gt=0)
    depth_m: float = Field(..., gt=0)
    height_m: float = Field(..., gt=0)
    price_paise: int = Field(..., ge=0, description="Price in Indian Paise (1 INR = 100 paise)")
    currency: str = Field(default="INR", max_length=3)
    asset_reference: Optional[str] = None
    source_url: Optional[str] = None
    source_verified_at: Optional[datetime] = None
    license_information: str = Field(default="Illustrative Demonstration Data")
    is_active: bool = True


class CatalogItemCreate(CatalogItemBase):
    id: str = Field(..., min_length=1, max_length=128)


class CatalogItemResponse(CatalogItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
