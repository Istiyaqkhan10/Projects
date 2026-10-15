import uuid
from datetime import UTC, datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.sqlite import JSON as SQLITE_JSON
from sqlalchemy.orm import relationship

from app.db.base import Base

# Universal JSON type compatible with both PostgreSQL and SQLite
try:
    from sqlalchemy.dialects.postgresql import JSONB
    from sqlalchemy.dialects.postgresql import UUID as PG_UUID
    JSON_TYPE = JSONB
    UUID_TYPE = PG_UUID(as_uuid=True)
except ImportError:
    JSON_TYPE = SQLITE_JSON
    UUID_TYPE = String(36)


def utcnow() -> datetime:
    return datetime.now(UTC)


def gen_uuid_str() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid_str)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=gen_uuid_str)
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    owner = relationship("User", back_populates="projects")
    rooms = relationship("Room", back_populates="project", cascade="all, delete-orphan")
    scenes = relationship("Scene", back_populates="project", cascade="all, delete-orphan")
    estimates = relationship("Estimate", back_populates="project", cascade="all, delete-orphan")
    proposals = relationship("AILayoutProposal", back_populates="project", cascade="all, delete-orphan")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(String(36), primary_key=True, default=gen_uuid_str)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    width_m = Column(Float, nullable=False)
    length_m = Column(Float, nullable=False)
    height_m = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    project = relationship("Project", back_populates="rooms")
    scenes = relationship("Scene", back_populates="room", cascade="all, delete-orphan")


class Scene(Base):
    __tablename__ = "scenes"

    id = Column(String(36), primary_key=True, default=gen_uuid_str)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    room_id = Column(String(36), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    revision = Column(Integer, default=1, nullable=False)
    schema_version = Column(Integer, default=1, nullable=False)
    scene_document = Column(JSON_TYPE, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("room_id", "revision", name="uq_scene_room_revision"),
    )

    project = relationship("Project", back_populates="scenes")
    room = relationship("Room", back_populates="scenes")


class CatalogItem(Base):
    __tablename__ = "catalog_items"

    id = Column(String(128), primary_key=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(64), nullable=False, index=True)
    manufacturer = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    width_m = Column(Float, nullable=False)
    depth_m = Column(Float, nullable=False)
    height_m = Column(Float, nullable=False)
    price_paise = Column(BigInteger, nullable=False, default=0)
    currency = Column(String(3), default="INR", nullable=False)
    asset_reference = Column(String(512), nullable=True)
    source_url = Column(String(1024), nullable=True)
    source_verified_at = Column(DateTime(timezone=True), nullable=True)
    license_information = Column(String(255), nullable=False, default="Illustrative Demonstration Data")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class Estimate(Base):
    __tablename__ = "estimates"

    id = Column(String(36), primary_key=True, default=gen_uuid_str)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    scene_revision = Column(Integer, nullable=False)
    estimate_snapshot = Column(JSON_TYPE, nullable=False)
    subtotal_paise = Column(BigInteger, nullable=False)
    tax_paise = Column(BigInteger, nullable=False)
    total_paise = Column(BigInteger, nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    assumptions = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    project = relationship("Project", back_populates="estimates")


class AILayoutProposal(Base):
    __tablename__ = "ai_layout_proposals"

    id = Column(String(36), primary_key=True, default=gen_uuid_str)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    base_scene_revision = Column(Integer, nullable=False)
    request_parameters = Column(JSON_TYPE, nullable=False)
    proposal_document = Column(JSON_TYPE, nullable=False)
    validation_status = Column(String(32), default="PENDING", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    project = relationship("Project", back_populates="proposals")
