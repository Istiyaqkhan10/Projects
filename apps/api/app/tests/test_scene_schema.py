import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.schemas.scene import CanonicalScene, RoomDimensions

FIXTURE_PATH = (
    Path(__file__).resolve().parents[4]
    / "packages"
    / "shared-fixtures"
    / "scene-examples"
    / "valid_living_room.json"
)


def test_valid_living_room_fixture():
    assert FIXTURE_PATH.exists(), f"Fixture not found at {FIXTURE_PATH}"
    with open(FIXTURE_PATH, encoding="utf-8") as f:
        data = json.load(f)

    scene = CanonicalScene(**data)
    assert scene.schema_version == 1
    assert scene.units == "m"
    assert scene.room.width_m == 5.0
    assert scene.room.length_m == 4.0
    assert len(scene.objects) == 2
    assert scene.objects[0].instance_id == "obj-sofa-01"


def test_invalid_negative_room_dimensions():
    with pytest.raises(ValidationError):
        RoomDimensions(width_m=-5.0, length_m=4.0, height_m=2.8)

    with pytest.raises(ValidationError):
        RoomDimensions(width_m=5.0, length_m=0.0, height_m=2.8)


def test_rotation_normalization():
    with open(FIXTURE_PATH, encoding="utf-8") as f:
        data = json.load(f)

    data["objects"][0]["rotation_y_deg"] = 450.0
    scene = CanonicalScene(**data)
    # 450 % 360 = 90.0
    assert scene.objects[0].rotation_y_deg == 90.0
