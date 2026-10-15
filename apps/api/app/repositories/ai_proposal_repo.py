import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import AILayoutProposal, Scene
from app.repositories.project_repo import ProjectRepository
from app.schemas.ai_layout import AILayoutRequest, SuggestedObject
from app.schemas.scene import CanonicalScene, RoomDimensions, SceneObject
from app.services.ai_layout import AILayoutService


class AILayoutProposalRepository:
    @staticmethod
    async def create_proposal(
        session: AsyncSession,
        project_id: str,
        request_data: AILayoutRequest,
    ) -> AILayoutProposal:
        # 1. Fetch latest scene for project to obtain room dimensions and base revision
        latest_scene = await ProjectRepository.get_latest_scene(session, project_id)
        if not latest_scene:
            raise ValueError(f"Project '{project_id}' has no active scene.")

        scene_doc = latest_scene.scene_document
        room_data = scene_doc.get("room", {})
        room = RoomDimensions(
            width_m=room_data.get("width_m", 5.0),
            length_m=room_data.get("length_m", 4.0),
            height_m=room_data.get("height_m", 2.8),
        )

        # 2. Generate structured layout proposal
        (
            explanation,
            suggested_objects,
            validation_status,
            validation_errors,
        ) = AILayoutService.generate_layout(
            room=room,
            prompt=request_data.prompt,
            room_type=request_data.room_type,
            preferred_item_ids=request_data.preferred_item_ids,
        )

        # 3. Construct proposal document
        proposal_document = {
            "explanation": explanation,
            "suggested_objects": [s.model_dump() for s in suggested_objects],
            "validation_status": validation_status,
            "validation_errors": validation_errors,
        }

        proposal = AILayoutProposal(
            project_id=project_id,
            base_scene_revision=latest_scene.revision,
            request_parameters=request_data.model_dump(),
            proposal_document=proposal_document,
            validation_status=validation_status,
        )

        session.add(proposal)
        await session.commit()
        await session.refresh(proposal)
        return proposal

    @staticmethod
    async def list_proposals(
        session: AsyncSession, project_id: str
    ) -> List[AILayoutProposal]:
        stmt = (
            select(AILayoutProposal)
            .where(AILayoutProposal.project_id == project_id)
            .order_by(desc(AILayoutProposal.created_at))
        )
        res = await session.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def get_proposal(
        session: AsyncSession, proposal_id: str
    ) -> Optional[AILayoutProposal]:
        stmt = select(AILayoutProposal).where(AILayoutProposal.id == proposal_id)
        res = await session.execute(stmt)
        return res.scalar_one_or_none()

    @staticmethod
    async def apply_proposal(
        session: AsyncSession,
        project_id: str,
        proposal_id: str,
        expected_revision: int,
    ) -> Scene:
        # 1. Fetch proposal
        proposal = await AILayoutProposalRepository.get_proposal(session, proposal_id)
        if not proposal or proposal.project_id != project_id:
            raise ValueError(f"Proposal '{proposal_id}' not found for project '{project_id}'")

        # 2. Fetch latest scene to verify optimistic lock
        latest_scene = await ProjectRepository.get_latest_scene(session, project_id)
        if not latest_scene:
            raise ValueError(f"Project '{project_id}' has no scene.")

        if latest_scene.revision != expected_revision:
            raise ValueError(
                f"Conflict: Active scene revision #{latest_scene.revision} does not match expected revision #{expected_revision}."
            )

        # 3. Build CanonicalScene from proposal suggested objects
        doc = proposal.proposal_document
        suggested_raw = doc.get("suggested_objects", [])
        current_room = latest_scene.scene_document.get("room", {})

        new_objects: List[SceneObject] = []
        for s in suggested_raw:
            new_objects.append(
                SceneObject(
                    instance_id=f"inst-ai-{uuid.uuid4().hex[:8]}",
                    catalog_item_id=s["catalog_item_id"],
                    position=s["position"],
                    rotation_y_deg=s.get("rotation_y_deg", 0.0),
                    dimensions=s["dimensions"],
                )
            )

        new_canonical_scene = CanonicalScene(
            schema_version=1,
            units="m",
            room=RoomDimensions(
                width_m=current_room.get("width_m", 5.0),
                length_m=current_room.get("length_m", 4.0),
                height_m=current_room.get("height_m", 2.8),
            ),
            objects=new_objects,
        )

        # 4. Save new scene revision using ProjectRepository (enforces geometric validation)
        new_scene = await ProjectRepository.save_scene_revision(
            session=session,
            project_id=project_id,
            expected_revision=expected_revision,
            scene=new_canonical_scene,
        )

        # 5. Mark proposal as applied
        proposal.validation_status = "APPLIED"
        await session.commit()
        return new_scene
