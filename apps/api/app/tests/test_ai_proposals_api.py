import pytest
from httpx import ASGITransport, AsyncClient

from app.db.session import init_db
from app.main import app


@pytest.fixture(autouse=True)
async def setup_database():
    await init_db()


@pytest.mark.asyncio
async def test_ai_proposal_generation_and_application():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Create a project
        proj_res = await ac.post(
            "/api/v1/projects",
            json={
                "name": "Koramangala Studio Apartment",
                "room_name": "Living Hall",
                "room_width_m": 5.0,
                "room_length_m": 4.5,
                "room_height_m": 2.8,
            },
        )
        assert proj_res.status_code == 201
        project_id = proj_res.json()["id"]

        # Initial scene revision is 1
        scene_res = await ac.get(f"/api/v1/projects/{project_id}/scene")
        assert scene_res.status_code == 200
        assert scene_res.json()["revision"] == 1
        assert len(scene_res.json()["scene"]["objects"]) == 0

        # 2. Request AI Layout Proposal for Living Room
        proposal_payload = {
            "prompt": "Airy contemporary living room layout with sofa and coffee table",
            "room_type": "living_room",
        }
        gen_res = await ac.post(
            f"/api/v1/projects/{project_id}/ai-proposals",
            json=proposal_payload,
        )
        assert gen_res.status_code == 201
        proposal = gen_res.json()
        proposal_id = proposal["id"]

        assert proposal["project_id"] == project_id
        assert proposal["base_scene_revision"] == 1
        assert proposal["validation_status"] == "VALID"
        assert len(proposal["suggested_objects"]) >= 2
        assert "living room" in proposal["explanation"].lower()

        # Check all suggested objects are strictly inside room bounds (5.0m x 4.5m)
        for obj in proposal["suggested_objects"]:
            pos = obj["position"]
            dim = obj["dimensions"]
            assert 0 <= pos["x_m"] <= 5.0
            assert 0 <= pos["z_m"] <= 4.5
            assert dim["width_m"] > 0
            assert dim["depth_m"] > 0

        # 3. List Proposals
        list_res = await ac.get(f"/api/v1/projects/{project_id}/ai-proposals")
        assert list_res.status_code == 200
        proposals_list = list_res.json()
        assert any(p["id"] == proposal_id for p in proposals_list)

        # 4. Get Single Proposal
        get_res = await ac.get(f"/api/v1/projects/{project_id}/ai-proposals/{proposal_id}")
        assert get_res.status_code == 200
        assert get_res.json()["id"] == proposal_id

        # 5. Apply the AI Proposal to the Active Scene (Revision 1 -> 2)
        apply_res = await ac.post(
            f"/api/v1/projects/{project_id}/ai-proposals/{proposal_id}/apply",
            json={"expected_revision": 1},
        )
        assert apply_res.status_code == 200
        applied_scene = apply_res.json()
        assert applied_scene["revision"] == 2
        assert len(applied_scene["scene"]["objects"]) == len(proposal["suggested_objects"])

        # 6. Verify stale revision conflict detection (re-applying with expected_revision: 1 returns 409)
        stale_res = await ac.post(
            f"/api/v1/projects/{project_id}/ai-proposals/{proposal_id}/apply",
            json={"expected_revision": 1},
        )
        assert stale_res.status_code == 409
        conflict_err = stale_res.json()
        assert "Conflict" in conflict_err["detail"]["message"]

        # 7. Test Bedroom Layout Generation
        bed_res = await ac.post(
            f"/api/v1/projects/{project_id}/ai-proposals",
            json={"prompt": "Cozy master bedroom with queen bed", "room_type": "bedroom"},
        )
        assert bed_res.status_code == 201
        bed_proposal = bed_res.json()
        assert bed_proposal["validation_status"] == "VALID"
        assert any(s["catalog_item_id"] == "cat-king-bed" for s in bed_proposal["suggested_objects"])
