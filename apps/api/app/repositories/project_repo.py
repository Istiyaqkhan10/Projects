from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.entities import Project, Room, Scene
from app.schemas.project import ProjectCreate, ProjectUpdate, RoomUpdate
from app.schemas.scene import CanonicalScene


class ConflictException(Exception):
    def __init__(self, message: str, current_revision: int):
        super().__init__(message)
        self.current_revision = current_revision


class ProjectRepository:
    @staticmethod
    async def create_project_with_room_and_scene(
        session: AsyncSession,
        data: ProjectCreate,
        owner_id: str | None = None,
    ) -> Project:
        # 1. Create Project
        project = Project(
            owner_id=owner_id,
            name=data.name,
            description=data.description,
        )
        session.add(project)
        await session.flush()

        # 2. Create Room
        room = Room(
            project_id=project.id,
            name=data.room_name,
            width_m=data.room_width_m,
            length_m=data.room_length_m,
            height_m=data.room_height_m,
        )
        session.add(room)
        await session.flush()

        # 3. Create Initial Canonical Scene (Revision 1)
        initial_scene_doc = {
            "schema_version": 1,
            "units": "m",
            "room": {
                "width_m": data.room_width_m,
                "length_m": data.room_length_m,
                "height_m": data.room_height_m,
            },
            "objects": [],
        }

        scene = Scene(
            project_id=project.id,
            room_id=room.id,
            revision=1,
            schema_version=1,
            scene_document=initial_scene_doc,
        )
        session.add(scene)
        await session.commit()

        # Reload project with rooms
        return await ProjectRepository.get_project(session, project.id)

    @staticmethod
    async def list_projects(session: AsyncSession) -> list[Project]:
        stmt = (
            select(Project)
            .options(selectinload(Project.rooms))
            .order_by(desc(Project.created_at))
        )
        res = await session.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def get_project(session: AsyncSession, project_id: str) -> Project | None:
        stmt = (
            select(Project)
            .options(selectinload(Project.rooms))
            .where(Project.id == project_id)
        )
        res = await session.execute(stmt)
        return res.scalar_one_or_none()

    @staticmethod
    async def update_project(
        session: AsyncSession, project_id: str, data: ProjectUpdate
    ) -> Project | None:
        project = await ProjectRepository.get_project(session, project_id)
        if not project:
            return None

        if data.name is not None:
            project.name = data.name
        if data.description is not None:
            project.description = data.description

        await session.commit()
        await session.refresh(project)
        return project

    @staticmethod
    async def delete_project(session: AsyncSession, project_id: str) -> bool:
        project = await ProjectRepository.get_project(session, project_id)
        if not project:
            return False
        await session.delete(project)
        await session.commit()
        return True

    @staticmethod
    async def get_room(
        session: AsyncSession, project_id: str, room_id: str
    ) -> Room | None:
        stmt = select(Room).where(Room.id == room_id, Room.project_id == project_id)
        res = await session.execute(stmt)
        return res.scalar_one_or_none()

    @staticmethod
    async def update_room(
        session: AsyncSession, project_id: str, room_id: str, data: RoomUpdate
    ) -> Room | None:
        room = await ProjectRepository.get_room(session, project_id, room_id)
        if not room:
            return None

        if data.name is not None:
            room.name = data.name
        if data.width_m is not None:
            room.width_m = data.width_m
        if data.length_m is not None:
            room.length_m = data.length_m
        if data.height_m is not None:
            room.height_m = data.height_m

        # Also update room dimensions in latest scene
        latest_scene = await ProjectRepository.get_latest_scene(session, project_id)
        if latest_scene and isinstance(latest_scene.scene_document, dict):
            doc = dict(latest_scene.scene_document)
            doc_room = doc.get("room", {})
            if data.width_m is not None:
                doc_room["width_m"] = data.width_m
            if data.length_m is not None:
                doc_room["length_m"] = data.length_m
            if data.height_m is not None:
                doc_room["height_m"] = data.height_m
            doc["room"] = doc_room
            latest_scene.scene_document = doc

        await session.commit()
        await session.refresh(room)
        return room

    @staticmethod
    async def get_latest_scene(
        session: AsyncSession, project_id: str
    ) -> Scene | None:
        stmt = (
            select(Scene)
            .where(Scene.project_id == project_id)
            .order_by(desc(Scene.revision))
            .limit(1)
        )
        res = await session.execute(stmt)
        return res.scalar_one_or_none()

    @staticmethod
    async def save_scene_revision(
        session: AsyncSession,
        project_id: str,
        expected_revision: int,
        scene: CanonicalScene,
    ) -> Scene:
        latest = await ProjectRepository.get_latest_scene(session, project_id)
        if not latest:
            raise ValueError(f"Project '{project_id}' has no existing scene.")

        if latest.revision != expected_revision:
            raise ConflictException(
                f"Scene revision conflict: expected {expected_revision}, but server is at revision {latest.revision}.",
                current_revision=latest.revision,
            )

        new_scene = Scene(
            project_id=project_id,
            room_id=latest.room_id,
            revision=expected_revision + 1,
            schema_version=scene.schema_version,
            scene_document=scene.model_dump(),
        )
        session.add(new_scene)
        await session.commit()
        await session.refresh(new_scene)
        return new_scene
