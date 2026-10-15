import pytest
from httpx import ASGITransport, AsyncClient

from app.db.session import init_db
from app.main import app


@pytest.fixture(autouse=True)
async def setup_database():
    await init_db()


@pytest.mark.asyncio
async def test_pdf_report_generation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Create a project
        proj_res = await ac.post(
            "/api/v1/projects",
            json={
                "name": "Whitefield Villa Living Room",
                "description": "Luxury contemporary villa project in Whitefield, Bengaluru",
                "room_name": "Main Living Room",
                "room_width_m": 6.5,
                "room_length_m": 5.0,
                "room_height_m": 3.2,
            },
        )
        assert proj_res.status_code == 201
        project_id = proj_res.json()["id"]

        # 2. Add furniture to the scene (Revision 1 -> 2)
        scene_payload = {
            "expected_revision": 1,
            "scene": {
                "schema_version": 1,
                "units": "m",
                "room": {"width_m": 6.5, "length_m": 5.0, "height_m": 3.2},
                "objects": [
                    {
                        "instance_id": "inst-sofa",
                        "catalog_item_id": "cat-sofa-3seater",
                        "position": {"x_m": 3.25, "y_m": 0.0, "z_m": 2.0},
                        "rotation_y_deg": 0.0,
                        "dimensions": {"width_m": 2.1, "depth_m": 0.9, "height_m": 0.85},
                    },
                    {
                        "instance_id": "inst-table",
                        "catalog_item_id": "cat-coffee-table-wood",
                        "position": {"x_m": 3.25, "y_m": 0.0, "z_m": 3.2},
                        "rotation_y_deg": 0.0,
                        "dimensions": {"width_m": 1.1, "depth_m": 0.6, "height_m": 0.45},
                    },
                ],
            },
        }
        save_res = await ac.put(f"/api/v1/projects/{project_id}/scene", json=scene_payload)
        assert save_res.status_code == 200
        assert save_res.json()["revision"] == 2

        # 3. Export PDF Report (Latest Revision)
        report_res = await ac.get(f"/api/v1/projects/{project_id}/report.pdf")
        assert report_res.status_code == 200
        assert report_res.headers["content-type"] == "application/pdf"
        assert "Content-Disposition" in report_res.headers
        assert f"interiorai_{project_id[:8]}" in report_res.headers["Content-Disposition"]

        # Verify valid PDF binary signature
        pdf_bytes = report_res.content
        assert len(pdf_bytes) > 1000
        assert pdf_bytes.startswith(b"%PDF-")

        # 4. Export PDF Report for explicit scene revision
        rev_report_res = await ac.get(f"/api/v1/projects/{project_id}/report.pdf?scene_revision=2")
        assert rev_report_res.status_code == 200
        assert rev_report_res.content.startswith(b"%PDF-")

        # 5. Nonexistent Project returns 404
        bad_res = await ac.get("/api/v1/projects/nonexistent-id/report.pdf")
        assert bad_res.status_code == 404
