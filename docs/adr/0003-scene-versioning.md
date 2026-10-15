# ADR 0003: Scene Versioning and Concurrency Control

## Status
Accepted

## Context
In InteriorAI Studio, users manipulate 2D and 3D scenes across editing sessions, generate estimates, and request AI layout proposals that are computed asynchronously. If two requests attempt to mutate a scene concurrently, or if an AI proposal computed against revision $N$ is applied after the user has already manually edited the scene to revision $N+1$, silent overwrites would result in loss of user work.

## Decision
1. **Monotonic Revision Counter**: Every room scene has a monotonic integer `revision` (starting at 1) and a `schema_version` (starting at 1).
2. **Optimistic Concurrency Control**:
   - Every scene save (`PUT /api/v1/projects/{project_id}/scene`) must provide the client's currently known `expected_revision`.
   - If the database revision does not match `expected_revision`, the backend rejects the write with HTTP `409 Conflict`, returning the current server revision and scene state.
3. **AI Proposal Anchoring**:
   - When requesting an AI proposal (`POST /api/v1/projects/{project_id}/ai-layout-proposals`), the backend records the `base_scene_revision`.
   - Before applying an AI proposal (`POST /api/v1/projects/{project_id}/ai-layout-proposals/{proposal_id}/apply`), the backend verifies that the room's current scene revision still equals `base_scene_revision`. If the user has made intervening changes, the apply request is rejected or requires re-validation against the latest state.
4. **Schema Versioning**: The canonical scene document includes a `schema_version` attribute to facilitate forward migration if future milestones introduce additional geometric elements (e.g., doors, windows, multi-level partitions).

## Consequences
- Complete prevention of lost updates and silent overwrites.
- Clear error handling pathways in the UI for conflict resolution.
- Reliable anchoring for all AI layout transformations.
