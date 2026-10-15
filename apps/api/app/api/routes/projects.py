from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.project_repo import ConflictException, ProjectRepository
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    RoomCreate,
    RoomResponse,
    RoomUpdate,
)
from app.schemas.scene import CanonicalScene, SceneResponse, SceneUpdatePayload
from app.services.geometry import validate_scene_geometry

router = APIRouter()


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate, db: AsyncSession = Depends(get_db)
) -> ProjectResponse:
    project = await ProjectRepository.create_project_with_room_and_scene(db, data)
    return ProjectResponse.model_validate(project)


@router.get("", response_model=List[ProjectResponse])
async def list_projects(db: AsyncSession = Depends(get_db)) -> List[ProjectResponse]:
    projects = await ProjectRepository.list_projects(db)
    return [ProjectResponse.model_validate(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str, db: AsyncSession = Depends(get_db)
) -> ProjectResponse:
    project = await ProjectRepository.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str, data: ProjectUpdate, db: AsyncSession = Depends(get_db)
) -> ProjectResponse:
    project = await ProjectRepository.update_project(db, project_id, data)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str, db: AsyncSession = Depends(get_db)
) -> None:
    deleted = await ProjectRepository.delete_project(db, project_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")


# Room Endpoints
@router.patch("/{project_id}/rooms/{room_id}", response_model=RoomResponse)
async def update_room(
    project_id: str,
    room_id: str,
    data: RoomUpdate,
    db: AsyncSession = Depends(get_db),
) -> RoomResponse:
    room = await ProjectRepository.update_room(db, project_id, room_id, data)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return RoomResponse.model_validate(room)


# Scene Endpoints
@router.get("/{project_id}/scene", response_model=SceneResponse)
async def get_project_scene(
    project_id: str, db: AsyncSession = Depends(get_db)
) -> SceneResponse:
    scene_record = await ProjectRepository.get_latest_scene(db, project_id)
    if not scene_record:
        raise HTTPException(status_code=404, detail=f"Scene for project '{project_id}' not found")

    return SceneResponse(
        project_id=scene_record.project_id,
        room_id=scene_record.room_id,
        revision=scene_record.revision,
        schema_version=scene_record.schema_version,
        scene=CanonicalScene(**scene_record.scene_document),
    )


@router.put("/{project_id}/scene", response_model=SceneResponse)
async def save_project_scene(
    project_id: str,
    payload: SceneUpdatePayload,
    db: AsyncSession = Depends(get_db),
) -> SceneResponse:
    # 1. Authoritative geometry validation
    is_valid, errors = validate_scene_geometry(payload.scene)
    if not is_valid:
        raise HTTPException(
            status_code=422,
            detail={"message": "Scene geometry validation failed", "errors": errors},
        )

    # 2. Save with optimistic revision lock check
    try:
        new_scene = await ProjectRepository.save_scene_revision(
            db, project_id, payload.expected_revision, payload.scene
        )
    except ConflictException as ce:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": str(ce),
                "expected_revision": payload.expected_revision,
                "current_revision": ce.current_revision,
            },
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))

    return SceneResponse(
        project_id=new_scene.project_id,
        room_id=new_scene.room_id,
        revision=new_scene.revision,
        schema_version=new_scene.schema_version,
        scene=CanonicalScene(**new_scene.scene_document),
    )
