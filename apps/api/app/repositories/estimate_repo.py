import json
from pathlib import Path
from typing import Dict, List, Optional
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_shared_fixtures_dir
from app.models.entities import Estimate, Scene
from app.repositories.project_repo import ProjectRepository
from app.services.pricing import calculate_estimate

# Load trusted catalog data
FIXTURES_PATH = (
    get_shared_fixtures_dir()
    / "validation-cases"
    / "sample_catalog_items.json"
)


def load_catalog_prices() -> Dict[str, dict]:
    catalog_prices: Dict[str, dict] = {}
    if FIXTURES_PATH.exists():
        with open(FIXTURES_PATH, "r", encoding="utf-8") as f:
            items = json.load(f)
            for item in items:
                catalog_prices[item["id"]] = item
    return catalog_prices


class EstimateRepository:
    @staticmethod
    async def create_estimate_for_project(
        session: AsyncSession,
        project_id: str,
        scene_revision: Optional[int] = None,
    ) -> Estimate:
        # 1. Fetch requested or latest scene
        if scene_revision is not None:
            stmt = select(Scene).where(
                Scene.project_id == project_id,
                Scene.revision == scene_revision,
            )
            res = await session.execute(stmt)
            scene_record = res.scalar_one_or_none()
            if not scene_record:
                raise ValueError(
                    f"Scene revision #{scene_revision} not found for project '{project_id}'"
                )
        else:
            scene_record = await ProjectRepository.get_latest_scene(session, project_id)
            if not scene_record:
                raise ValueError(f"Project '{project_id}' has no scene to estimate.")

        # 2. Extract scene objects
        scene_doc = scene_record.scene_document
        scene_objects = scene_doc.get("objects", [])

        # 3. Load catalog prices and compute authoritative estimate
        catalog_prices = load_catalog_prices()
        snapshot = calculate_estimate(scene_objects, catalog_prices)

        # 4. Save immutable estimate record
        estimate = Estimate(
            project_id=project_id,
            scene_revision=scene_record.revision,
            estimate_snapshot=snapshot.model_dump(),
            subtotal_paise=snapshot.subtotal_paise,
            tax_paise=snapshot.tax_paise,
            total_paise=snapshot.total_paise,
            currency="INR",
            assumptions=snapshot.assumptions,
        )
        session.add(estimate)
        await session.commit()
        await session.refresh(estimate)
        return estimate

    @staticmethod
    async def list_estimates(
        session: AsyncSession, project_id: str
    ) -> List[Estimate]:
        stmt = (
            select(Estimate)
            .where(Estimate.project_id == project_id)
            .order_by(desc(Estimate.created_at))
        )
        res = await session.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def get_estimate(
        session: AsyncSession, estimate_id: str
    ) -> Optional[Estimate]:
        stmt = select(Estimate).where(Estimate.id == estimate_id)
        res = await session.execute(stmt)
        return res.scalar_one_or_none()
