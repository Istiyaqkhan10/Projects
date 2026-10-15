import json
from pathlib import Path
from app.schemas.scene import CanonicalScene
from app.services.geometry import validate_scene_geometry

FIXTURES_DIR = Path(__file__).resolve().parents[4] / "packages" / "shared-fixtures" / "scene-examples"


def test_valid_scene_geometry():
    path = FIXTURES_DIR / "valid_living_room.json"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    scene = CanonicalScene(**data)
    is_valid, errors = validate_scene_geometry(scene)
    assert is_valid is True
    assert len(errors) == 0


def test_boundary_clash_geometry():
    path = FIXTURES_DIR / "boundary_clash.json"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    scene = CanonicalScene(**data)
    is_valid, errors = validate_scene_geometry(scene)
    assert is_valid is False
    assert len(errors) > 0
    assert any("breaches right wall" in err for err in errors)
