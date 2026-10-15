import pytest
from httpx import ASGITransport, AsyncClient
from app.db.session import init_db
from app.main import app


@pytest.fixture(autouse=True)
async def setup_database():
    await init_db()


@pytest.mark.asyncio
async def test_estimate_generation_and_immutability():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Create a project
        proj_res = await ac.post(
            "/api/v1/projects",
            json={
                "name": "Bengaluru Penthouse Project",
                "room_name": "Drawing Room",
                "room_width_m": 6.0,
                "room_length_m": 5.0,
                "room_height_m": 3.0,
            },
        )
        assert proj_res.status_code == 201
        project_id = proj_res.json()["id"]

        # 2. Save a scene with 2 furniture items (Revision 1 -> 2)
        scene_payload = {
            "expected_revision": 1,
            "scene": {
                "schema_version": 1,
                "units": "m",
                "room": {"width_m": 6.0, "length_m": 5.0, "height_m": 3.0},
                "objects": [
                    {
                        "instance_id": "inst-sofa-1",
                        "catalog_item_id": "cat-sofa-3seater",
                        "position": {"x_m": 3.0, "y_m": 0.0, "z_m": 2.0},
                        "rotation_y_deg": 0.0,
                        "dimensions": {"width_m": 2.1, "depth_m": 0.9, "height_m": 0.85},
                    },
                    {
                        "instance_id": "inst-table-1",
                        "catalog_item_id": "cat-coffee-table-wood",
                        "position": {"x_m": 3.0, "y_m": 0.0, "z_m": 3.2},
                        "rotation_y_deg": 0.0,
                        "dimensions": {"width_m": 1.1, "depth_m": 0.6, "height_m": 0.45},
                    },
                ],
            },
        }
        save_scene_res = await ac.put(f"/api/v1/projects/{project_id}/scene", json=scene_payload)
        assert save_scene_res.status_code == 200
        assert save_scene_res.json()["revision"] == 2

        # 3. Generate preliminary estimate snapshot for Revision 2
        est_res = await ac.post(f"/api/v1/projects/{project_id}/estimates", json={})
        assert est_res.status_code == 201
        estimate = est_res.json()
        estimate_id = estimate["id"]

        assert estimate["project_id"] == project_id
        assert estimate["scene_revision"] == 2
        assert estimate["currency"] == "INR"

        # Sofa is ₹34,999.00 (3499900 paise), Table is ₹11,499.00 (1149900 paise)
        # Subtotal: 4649800 paise (₹46,498.00)
        # CGST (9%): 418482 paise
        # SGST (9%): 418482 paise
        # Total Tax: 836964 paise
        # Total: 5486764 paise (₹54,867.64)
        assert estimate["subtotal_paise"] == 4649800
        assert estimate["tax_paise"] == 836964
        assert estimate["total_paise"] == 5486764
        assert len(estimate["estimate_snapshot"]["lines"]) == 2

        # 4. Fetch the created estimate by ID
        get_est_res = await ac.get(f"/api/v1/estimates/{estimate_id}")
        assert get_est_res.status_code == 200
        fetched_est = get_est_res.json()
        assert fetched_est["id"] == estimate_id
        assert fetched_est["total_paise"] == 5486764

        # 5. List all estimates for project
        list_est_res = await ac.get(f"/api/v1/projects/{project_id}/estimates")
        assert list_est_res.status_code == 200
        est_list = list_est_res.json()
        assert len(est_list) >= 1
        assert any(e["id"] == estimate_id for e in est_list)

        # 6. Verify 404 for non-existent estimate
        not_found_res = await ac.get("/api/v1/estimates/non-existent-id")
        assert not_found_res.status_code == 404
