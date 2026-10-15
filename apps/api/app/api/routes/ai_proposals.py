
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.ai_proposal_repo import AILayoutProposalRepository
from app.schemas.ai_layout import (
    AILayoutProposalResponse,
    AILayoutRequest,
    ApplyProposalRequest,
    SuggestedObject,
)
from app.schemas.scene import SceneResponse

router = APIRouter()


def _to_proposal_response(proposal) -> AILayoutProposalResponse:
    doc = proposal.proposal_document or {}
    suggested = [
        SuggestedObject(**item) for item in doc.get("suggested_objects", [])
    ]
    return AILayoutProposalResponse(
        id=proposal.id,
        project_id=proposal.project_id,
        base_scene_revision=proposal.base_scene_revision,
        request_parameters=proposal.request_parameters or {},
        explanation=doc.get("explanation", ""),
        suggested_objects=suggested,
        validation_status=proposal.validation_status,
        validation_errors=doc.get("validation_errors", []),
        created_at=proposal.created_at,
    )


@router.post(
    "/{project_id}/ai-proposals",
    response_model=AILayoutProposalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a validated AI furniture layout proposal",
)
async def generate_proposal(
    project_id: str,
    payload: AILayoutRequest,
    session: AsyncSession = Depends(get_db),
) -> AILayoutProposalResponse:
    try:
        proposal = await AILayoutProposalRepository.create_proposal(
            session=session,
            project_id=project_id,
            request_data=payload,
        )
        return _to_proposal_response(proposal)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate layout proposal: {str(e)}",
        )


@router.get(
    "/{project_id}/ai-proposals",
    response_model=list[AILayoutProposalResponse],
    summary="List all AI layout proposals generated for a project",
)
async def list_proposals(
    project_id: str,
    session: AsyncSession = Depends(get_db),
) -> list[AILayoutProposalResponse]:
    proposals = await AILayoutProposalRepository.list_proposals(
        session=session, project_id=project_id
    )
    return [_to_proposal_response(p) for p in proposals]


@router.get(
    "/{project_id}/ai-proposals/{proposal_id}",
    response_model=AILayoutProposalResponse,
    summary="Get single AI layout proposal details",
)
async def get_proposal(
    project_id: str,
    proposal_id: str,
    session: AsyncSession = Depends(get_db),
) -> AILayoutProposalResponse:
    proposal = await AILayoutProposalRepository.get_proposal(
        session=session, proposal_id=proposal_id
    )
    if not proposal or proposal.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Proposal '{proposal_id}' not found for project '{project_id}'",
        )
    return _to_proposal_response(proposal)


@router.post(
    "/{project_id}/ai-proposals/{proposal_id}/apply",
    response_model=SceneResponse,
    summary="Apply an approved AI layout proposal to the active scene",
)
async def apply_proposal(
    project_id: str,
    proposal_id: str,
    payload: ApplyProposalRequest,
    session: AsyncSession = Depends(get_db),
) -> SceneResponse:
    try:
        new_scene = await AILayoutProposalRepository.apply_proposal(
            session=session,
            project_id=project_id,
            proposal_id=proposal_id,
            expected_revision=payload.expected_revision,
        )
        return SceneResponse(
            project_id=new_scene.project_id,
            room_id=new_scene.room_id,
            revision=new_scene.revision,
            schema_version=new_scene.schema_version,
            scene=new_scene.scene_document,
        )
    except ValueError as e:
        msg = str(e)
        if "Conflict" in msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"message": msg, "expected_revision": payload.expected_revision},
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
