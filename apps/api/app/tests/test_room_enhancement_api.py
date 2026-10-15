import pytest
from httpx import ASGITransport, AsyncClient

from app.db.session import init_db
from app.main import app

# 1x1 transparent PNG in base64
TINY_PNG_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="


@pytest.fixture(autouse=True)
async def setup_database():
    await init_db()


@pytest.mark.asyncio
async def test_room_photo_enhancement_and_application():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Create a project
        proj_res = await ac.post(
            "/api/v1/projects",
            json={
                "name": "Juhu Coastal Residence",
                "room_name": "Living Room",
                "room_width_m": 5.5,
                "room_length_m": 4.5,
                "room_height_m": 2.9,
            },
        )
        assert proj_res.status_code == 201
        project_id = proj_res.json()["id"]

        # 2. Upload room photo for AI enhancement
        enhance_payload = {
            "image_base64": TINY_PNG_BASE64,
            "style_preference": "Warm Contemporary",
            "room_type": "living_room",
            "preserve_furniture": False,
        }
        res = await ac.post(
            f"/api/v1/projects/{project_id}/enhance-room-image",
            json=enhance_payload,
        )
        assert res.status_code == 200
        data = res.json()

        assert "Contemporary" in data["theme_title"]
        assert len(data["color_palette"]) >= 3
        # Check primary wall color
        primary = next(c for c in data["color_palette"] if "Primary" in c["role"])
        assert primary["hex"].startswith("#")

        # Check lighting recommendation
        assert 2700 <= data["lighting"]["temperature_k"] <= 5000
        assert len(data["lighting"]["recommended_fixtures"]) >= 1

        # Check flooring
        assert data["floor_material"] in [
            "hardwood_teak",
            "oak_parquet",
            "white_marble",
            "kota_stone",
            "polished_concrete",
        ]

        # Check concept visualization SVG
        assert "<svg" in data["enhanced_visualization_svg"]
        assert len(data["suggested_furniture"]) >= 1

        # 3. Apply the AI Room Enhancement to Active Scene (Revision 1 -> 2)
        apply_payload = {
            "expected_revision": 1,
            "apply_colors_and_lighting": True,
            "apply_furniture": True,
            "styling_payload": data["styling"],
            "suggested_objects": data["suggested_furniture"],
        }
        apply_res = await ac.post(
            f"/api/v1/projects/{project_id}/apply-enhancement",
            json=apply_payload,
        )
        assert apply_res.status_code == 200
        new_scene = apply_res.json()
        assert new_scene["revision"] == 2

        # Verify styling was applied to canonical scene document
        scene_doc = new_scene["scene"]
        assert "styling" in scene_doc
        assert scene_doc["styling"]["wall_color"] == data["styling"]["wall_color"]
        assert scene_doc["styling"]["floor_material"] == data["styling"]["floor_material"]
        assert scene_doc["styling"]["lighting"]["temperature_k"] == data["styling"]["lighting"]["temperature_k"]
        assert len(scene_doc["objects"]) == len(data["suggested_furniture"])

        # 4. Conflict check (re-applying with expected_revision: 1 returns 409)
        conflict_res = await ac.post(
            f"/api/v1/projects/{project_id}/apply-enhancement",
            json=apply_payload,
        )
        assert conflict_res.status_code == 409
