from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.estimate_repo import load_catalog_prices
from app.repositories.project_repo import ProjectRepository
from app.services.pricing import calculate_estimate
from app.services.report_generation import build_project_pdf_report

router = APIRouter()


@router.get(
    "/{project_id}/report.pdf",
    summary="Download comprehensive interior design and budget PDF report",
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Returns compiled binary PDF report",
        }
    },
)
async def download_project_report(
    project_id: str,
    scene_revision: Optional[int] = Query(None, description="Optional scene revision to export. Defaults to latest."),
    session: AsyncSession = Depends(get_db),
) -> Response:
    # 1. Fetch Project
    project = await ProjectRepository.get_project(session, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found",
        )

    # 2. Fetch Room
    room = project.rooms[0] if project.rooms else None
    room_name = room.name if room else "Room"
    room_width = room.width_m if room else 5.0
    room_length = room.length_m if room else 4.0
    room_height = room.height_m if room else 2.8

    # 3. Fetch Scene
    if scene_revision is not None:
        from sqlalchemy import select
        from app.models.entities import Scene

        stmt = select(Scene).where(
            Scene.project_id == project_id,
            Scene.revision == scene_revision,
        )
        res = await session.execute(stmt)
        scene = res.scalar_one_or_none()
        if not scene:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scene revision #{scene_revision} not found for project '{project_id}'",
            )
    else:
        scene = await ProjectRepository.get_latest_scene(session, project_id)
        if not scene:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No active scene found for project '{project_id}'",
            )

    scene_doc = scene.scene_document or {}
    objects = scene_doc.get("objects", [])

    # Update room dimensions from scene document if present
    scene_room = scene_doc.get("room", {})
    if scene_room:
        room_width = scene_room.get("width_m", room_width)
        room_length = scene_room.get("length_m", room_length)
        room_height = scene_room.get("height_m", room_height)

    # 4. Authoritative Pricing
    catalog_map = load_catalog_prices()
    estimate = calculate_estimate(objects, catalog_map)

    # 5. Build PDF
    pdf_bytes = build_project_pdf_report(
        project_name=project.name,
        project_description=project.description,
        room_name=room_name,
        room_width_m=room_width,
        room_length_m=room_length,
        room_height_m=room_height,
        scene_revision=scene.revision,
        objects=objects,
        catalog_map=catalog_map,
        subtotal_paise=estimate.subtotal_paise,
        cgst_paise=estimate.cgst_paise,
        sgst_paise=estimate.sgst_paise,
        total_paise=estimate.total_paise,
        assumptions=estimate.assumptions,
    )

    filename = f"interiorai_{project_id[:8]}_rev{scene.revision}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )
