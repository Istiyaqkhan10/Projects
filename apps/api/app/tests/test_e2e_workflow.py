import pytest
from httpx import ASGITransport, AsyncClient
from app.db.session import init_db
from app.main import app


@pytest.fixture(autouse=True)
async def setup_database():
    await init_db()


@pytest.mark.asyncio
async def test_full_interior_studio_e2e_lifecycle():
    """
    End-to-End verification of the entire user lifecycle:
    Health -> Catalog -> Project Creation -> Manual Scene Placement ->
    Boundary Enforcement -> Estimate Generation -> AI Layout Proposal ->
    Safe Proposal Application -> Conflict Protection -> PDF Export.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Step 1: Health & Connectivity
        health_res = await ac.get("/api/v1/health")
        assert health_res.status_code == 200
        assert health_res.json()["status"] == "healthy"

        # Step 2: Browse Catalog
        catalog_res = await ac.get("/api/v1/catalog")
        assert catalog_res.status_code == 200
        catalog = catalog_res.json()
        assert len(catalog) >= 3
        assert any(item["id"] == "cat-sofa-3seater" for item in catalog)

        # Step 3: Create New Project with Room Geometry
        proj_payload = {
            "name": "Bandra Seafront Apartment",
            "description": "Full interior design specification for 3BHK coastal residence",
            "room_name": "Living & Dining Lounge",
            "room_width_m": 6.0,
            "room_length_m": 5.0,
            "room_height_m": 3.0,
        }
        proj_res = await ac.post("/api/v1/projects", json=proj_payload)
        assert proj_res.status_code == 201
        project = proj_res.json()
        project_id = project["id"]
        assert len(project["rooms"]) == 1

        # Step 4: Verify Initial Scene (Revision 1)
        scene_res = await ac.get(f"/api/v1/projects/{project_id}/scene")
        assert scene_res.status_code == 200
        scene_data = scene_res.json()
        assert scene_data["revision"] == 1
        assert len(scene_data["scene"]["objects"]) == 0

        # Step 5: Place Initial Furniture (Revision 1 -> 2)
        valid_placement = {
            "expected_revision": 1,
            "scene": {
                "schema_version": 1,
                "units": "m",
                "room": {"width_m": 6.0, "length_m": 5.0, "height_m": 3.0},
                "objects": [
                    {
                        "instance_id": "inst-sofa-01",
                        "catalog_item_id": "cat-sofa-3seater",
                        "position": {"x_m": 3.0, "y_m": 0.0, "z_m": 1.5},
                        "rotation_y_deg": 0.0,
                        "dimensions": {"width_m": 2.1, "depth_m": 0.9, "height_m": 0.85},
                    },
                    {
                        "instance_id": "inst-table-01",
                        "catalog_item_id": "cat-coffee-table-wood",
                        "position": {"x_m": 3.0, "y_m": 0.0, "z_m": 2.6},
                        "rotation_y_deg": 0.0,
                        "dimensions": {"width_m": 1.1, "depth_m": 0.6, "height_m": 0.45},
                    },
                ],
            },
        }
        save_res = await ac.put(f"/api/v1/projects/{project_id}/scene", json=valid_placement)
        assert save_res.status_code == 200
        assert save_res.json()["revision"] == 2

        # Step 6: Test Boundary Clash Rejection
        clash_placement = {
            "expected_revision": 2,
            "scene": {
                "schema_version": 1,
                "units": "m",
                "room": {"width_m": 6.0, "length_m": 5.0, "height_m": 3.0},
                "objects": [
                    {
                        "instance_id": "inst-sofa-clashing",
                        "catalog_item_id": "cat-sofa-3seater",
                        "position": {"x_m": 7.0, "y_m": 0.0, "z_m": 1.5},  # Beyond right wall (X=6.0m)
                        "rotation_y_deg": 0.0,
                        "dimensions": {"width_m": 2.1, "depth_m": 0.9, "height_m": 0.85},
                    }
                ],
            },
        }
        clash_res = await ac.put(f"/api/v1/projects/{project_id}/scene", json=clash_placement)
        assert clash_res.status_code == 422
        assert "breaches right wall" in str(clash_res.json()["detail"]["errors"])

        # Step 7: Generate Official Estimate Snapshot for Revision 2
        est_res = await ac.post(f"/api/v1/projects/{project_id}/estimates", json={})
        assert est_res.status_code == 201
        estimate = est_res.json()
        assert estimate["scene_revision"] == 2
        assert estimate["currency"] == "INR"
        # Subtotal: 3499900 + 1149900 = 4649800 paise
        assert estimate["subtotal_paise"] == 4649800
        # CGST: (4649800 * 900 + 5000) // 10000 = 418482 paise
        assert estimate["estimate_snapshot"]["cgst_paise"] == 418482
        assert estimate["total_paise"] == 5486764

        # Step 8: Verify Estimate History
        est_list_res = await ac.get(f"/api/v1/projects/{project_id}/estimates")
        assert est_list_res.status_code == 200
        assert len(est_list_res.json()) >= 1

        # Step 9: Request AI Layout Proposal
        ai_req = {
            "room_type": "living_room",
            "prompt": "Modern social layout with sofa, table, armchair, and storage",
        }
        ai_res = await ac.post(f"/api/v1/projects/{project_id}/ai-proposals", json=ai_req)
        assert ai_res.status_code == 201
        proposal = ai_res.json()
        proposal_id = proposal["id"]
        assert proposal["validation_status"] == "VALID"
        assert len(proposal["suggested_objects"]) >= 2

        # Step 10: Apply AI Proposal to Active Scene (Revision 2 -> 3)
        apply_res = await ac.post(
            f"/api/v1/projects/{project_id}/ai-proposals/{proposal_id}/apply",
            json={"expected_revision": 2},
        )
        assert apply_res.status_code == 200
        applied_scene = apply_res.json()
        assert applied_scene["revision"] == 3
        assert len(applied_scene["scene"]["objects"]) == len(proposal["suggested_objects"])

        # Step 11: Verify Optimistic Concurrency Conflict (re-using expected_revision 2 returns 409)
        conflict_res = await ac.post(
            f"/api/v1/projects/{project_id}/ai-proposals/{proposal_id}/apply",
            json={"expected_revision": 2},
        )
        assert conflict_res.status_code == 409

        # Step 12: Export Formal PDF Specification & Budget Report
        pdf_res = await ac.get(f"/api/v1/projects/{project_id}/report.pdf")
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert pdf_res.content.startswith(b"%PDF-")
        assert len(pdf_res.content) > 1000
