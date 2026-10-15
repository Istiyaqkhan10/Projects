import pytest
from httpx import ASGITransport, AsyncClient

from app.db.session import init_db
from app.main import app


@pytest.fixture(autouse=True)
async def setup_database():
    await init_db()


@pytest.mark.asyncio
async def test_project_crud_and_scene_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Create a Project
        payload = {
            "name": "Mumbai Highrise Apartment",
            "description": "3BHK coastal apartment interior project",
            "room_name": "Living Room",
            "room_width_m": 5.5,
            "room_length_m": 4.5,
            "room_height_m": 2.9,
        }
        res = await ac.post("/api/v1/projects", json=payload)
        assert res.status_code == 201
        project_data = res.json()
        project_id = project_data["id"]
        assert project_data["name"] == "Mumbai Highrise Apartment"
        assert len(project_data["rooms"]) == 1
        room = project_data["rooms"][0]
        room_id = room["id"]
        assert room["width_m"] == 5.5
        assert room["length_m"] == 4.5
        assert room["height_m"] == 2.9

        # 2. List Projects
        list_res = await ac.get("/api/v1/projects")
        assert list_res.status_code == 200
        projects_list = list_res.json()
        assert any(p["id"] == project_id for p in projects_list)

        # 3. Get Project Scene (should be initial revision 1)
        scene_res = await ac.get(f"/api/v1/projects/{project_id}/scene")
        assert scene_res.status_code == 200
        scene_data = scene_res.json()
        assert scene_data["revision"] == 1
        assert scene_data["scene"]["units"] == "m"
        assert scene_data["scene"]["room"]["width_m"] == 5.5
        assert scene_data["scene"]["room"]["length_m"] == 4.5
        assert len(scene_data["scene"]["objects"]) == 0

        # 4. Save Scene with valid furniture placement (Revision 1 -> 2)
        valid_scene_payload = {
            "expected_revision": 1,
            "scene": {
                "schema_version": 1,
                "units": "m",
                "room": {"width_m": 5.5, "length_m": 4.5, "height_m": 2.9},
                "objects": [
                    {
                        "instance_id": "inst-sofa-01",
                        "catalog_item_id": "cat-sofa-3seater",
                        "position": {"x_m": 2.5, "y_m": 0.0, "z_m": 2.0},
                        "rotation_y_deg": 0.0,
                        "dimensions": {"width_m": 2.1, "depth_m": 0.9, "height_m": 0.85},
                    }
                ],
            },
        }
        save_res = await ac.put(f"/api/v1/projects/{project_id}/scene", json=valid_scene_payload)
        assert save_res.status_code == 200
        saved_scene = save_res.json()
        assert saved_scene["revision"] == 2
        assert len(saved_scene["scene"]["objects"]) == 1

        # 5. Stale Revision Conflict Check (Submitting expected_revision: 1 again should return 409)
        conflict_res = await ac.put(f"/api/v1/projects/{project_id}/scene", json=valid_scene_payload)
        assert conflict_res.status_code == 409
        conflict_data = conflict_res.json()
        assert "detail" in conflict_data
        assert conflict_data["detail"]["current_revision"] == 2

        # 6. Boundary Violation Check (Placing furniture partly outside room should return 422)
        clash_payload = {
            "expected_revision": 2,
            "scene": {
                "schema_version": 1,
                "units": "m",
                "room": {"width_m": 5.5, "length_m": 4.5, "height_m": 2.9},
                "objects": [
                    {
                        "instance_id": "inst-out-of-bounds",
                        "catalog_item_id": "cat-sofa-3seater",
                        "position": {"x_m": 6.0, "y_m": 0.0, "z_m": 2.0},  # Center is 6.0 > room width 5.5
                        "rotation_y_deg": 0.0,
                        "dimensions": {"width_m": 2.1, "depth_m": 0.9, "height_m": 0.85},
                    }
                ],
            },
        }
        clash_res = await ac.put(f"/api/v1/projects/{project_id}/scene", json=clash_payload)
        assert clash_res.status_code == 422
        clash_data = clash_res.json()
        assert "errors" in clash_data["detail"]

        # 7. Update Room dimensions
        patch_room_res = await ac.patch(
            f"/api/v1/projects/{project_id}/rooms/{room_id}",
            json={"width_m": 6.0, "name": "Expanded Living Room"},
        )
        assert patch_room_res.status_code == 200
        updated_room = patch_room_res.json()
        assert updated_room["width_m"] == 6.0
        assert updated_room["name"] == "Expanded Living Room"

        # 8. Delete Project
        del_res = await ac.delete(f"/api/v1/projects/{project_id}")
        assert del_res.status_code == 204

        # Verify project is gone
        get_gone = await ac.get(f"/api/v1/projects/{project_id}")
        assert get_gone.status_code == 404
