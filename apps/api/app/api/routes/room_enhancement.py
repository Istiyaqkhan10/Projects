import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.project_repo import ProjectRepository
from app.schemas.room_enhancement import (
    ApplyEnhancementRequest,
    RoomEnhancementResponse,
    RoomEnhanceRequest,
)
from app.schemas.scene import (
    CanonicalScene,
    RoomDimensions,
    SceneObject,
    SceneResponse,
)
from app.services.room_enhancement import RoomEnhancementService

router = APIRouter()


@router.post(
    "/{project_id}/enhance-room-image",
    response_model=RoomEnhancementResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze uploaded room photo and generate a bespoke color, lighting, and interior enhancement plan",
)
async def enhance_room_image(
    project_id: str,
    payload: RoomEnhanceRequest,
    session: AsyncSession = Depends(get_db),
) -> RoomEnhancementResponse:
    # 1. Fetch latest scene for project to obtain room dimensions
    latest_scene = await ProjectRepository.get_latest_scene(session, project_id)
    if not latest_scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' has no active scene.",
        )

    scene_doc = latest_scene.scene_document or {}
    room_data = scene_doc.get("room", {})
    room = RoomDimensions(
        width_m=room_data.get("width_m", 5.0),
        length_m=room_data.get("length_m", 4.0),
        height_m=room_data.get("height_m", 2.8),
    )

    # 2. Analyze photo and synthesize interior enhancement plan
    enhancement = RoomEnhancementService.enhance_room_from_image(
        image_base64=payload.image_base64,
        room=room,
        style_preference=payload.style_preference,
        room_type=payload.room_type,
        preserve_furniture=payload.preserve_furniture,
    )
    enhancement.project_id = project_id
    return enhancement


@router.post(
    "/{project_id}/apply-enhancement",
    response_model=SceneResponse,
    summary="Apply AI room makeover (wall colors, lighting temperature, and furniture) to the active scene",
)
async def apply_room_enhancement(
    project_id: str,
    payload: ApplyEnhancementRequest,
    session: AsyncSession = Depends(get_db),
) -> SceneResponse:
    # 1. Optimistic locking check
    latest_scene = await ProjectRepository.get_latest_scene(session, project_id)
    if not latest_scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found.",
        )

    if latest_scene.revision != payload.expected_revision:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": f"Conflict: Current scene is at revision #{latest_scene.revision}, expected #{payload.expected_revision}",
                "expected_revision": payload.expected_revision,
                "current_revision": latest_scene.revision,
            },
        )

    scene_doc = latest_scene.scene_document or {}
    current_room = scene_doc.get("room", {})
    existing_objects = scene_doc.get("objects", [])

    # 2. Update styling
    current_styling = scene_doc.get("styling")
    if payload.apply_colors_and_lighting and payload.styling_payload:
        current_styling = payload.styling_payload.model_dump()

    # 3. Update objects
    final_objects: list[SceneObject] = []
    if payload.apply_furniture and payload.suggested_objects:
        for s in payload.suggested_objects:
            final_objects.append(
                SceneObject(
                    instance_id=f"inst-ai-{uuid.uuid4().hex[:8]}",
                    catalog_item_id=s.catalog_item_id,
                    position=s.position,
                    rotation_y_deg=s.rotation_y_deg,
                    dimensions=s.dimensions,
                )
            )
    else:
        # Keep existing objects
        for o in existing_objects:
            final_objects.append(SceneObject(**o))

    # 4. Construct new CanonicalScene
    new_scene_model = CanonicalScene(
        schema_version=1,
        units="m",
        room=RoomDimensions(
            width_m=current_room.get("width_m", 5.0),
            length_m=current_room.get("length_m", 4.0),
            height_m=current_room.get("height_m", 2.8),
        ),
        styling=current_styling,
        objects=final_objects,
    )

    # 5. Persist with revision increment
    new_scene = await ProjectRepository.save_scene_revision(
        session=session,
        project_id=project_id,
        expected_revision=payload.expected_revision,
        scene=new_scene_model,
    )

    return SceneResponse(
        project_id=new_scene.project_id,
        room_id=new_scene.room_id,
        revision=new_scene.revision,
        schema_version=new_scene.schema_version,
        scene=new_scene.scene_document,
    )
