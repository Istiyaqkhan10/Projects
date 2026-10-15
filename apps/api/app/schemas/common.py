
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "healthy"
    environment: str
    version: str
    project_name: str


class ErrorResponse(BaseModel):
    detail: str
    error_code: str | None = None
