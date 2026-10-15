
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.estimate_repo import EstimateRepository
from app.schemas.estimate import EstimateCreateRequest, EstimateResponse

router = APIRouter()


@router.post(
    "/projects/{project_id}/estimates",
    response_model=EstimateResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["estimates"],
)
async def create_estimate(
    project_id: str,
    payload: EstimateCreateRequest | None = None,
    db: AsyncSession = Depends(get_db),
) -> EstimateResponse:
    scene_rev = payload.scene_revision if payload else None
    try:
        estimate = await EstimateRepository.create_estimate_for_project(
            db, project_id, scene_rev
        )
        return EstimateResponse.model_validate(estimate)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


@router.get(
    "/projects/{project_id}/estimates",
    response_model=list[EstimateResponse],
    tags=["estimates"],
)
async def list_project_estimates(
    project_id: str, db: AsyncSession = Depends(get_db)
) -> list[EstimateResponse]:
    estimates = await EstimateRepository.list_estimates(db, project_id)
    return [EstimateResponse.model_validate(e) for e in estimates]


@router.get(
    "/estimates/{estimate_id}",
    response_model=EstimateResponse,
    tags=["estimates"],
)
async def get_estimate(
    estimate_id: str, db: AsyncSession = Depends(get_db)
) -> EstimateResponse:
    estimate = await EstimateRepository.get_estimate(db, estimate_id)
    if not estimate:
        raise HTTPException(
            status_code=404, detail=f"Estimate '{estimate_id}' not found"
        )
    return EstimateResponse.model_validate(estimate)
