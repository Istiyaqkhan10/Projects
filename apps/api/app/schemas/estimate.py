from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.services.pricing import EstimateSnapshot


class EstimateCreateRequest(BaseModel):
    scene_revision: int | None = Field(
        None, description="Specific scene revision to estimate. Defaults to latest."
    )


class EstimateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    scene_revision: int
    subtotal_paise: int
    tax_paise: int
    total_paise: int
    currency: str = "INR"
    assumptions: str | None = None
    estimate_snapshot: EstimateSnapshot
    created_at: datetime
