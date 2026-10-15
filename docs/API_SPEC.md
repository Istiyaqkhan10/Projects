# API Specification — InteriorAI Studio

## Base URL
`/api/v1`

## Common Conventions
- Requests and responses use `application/json; charset=utf-8`.
- Errors return standard error payloads:
  ```json
  {
    "detail": "Description of error",
    "error_code": "RESOURCE_CONFLICT",
    "timestamp": "2026-10-15T14:00:00Z"
  }
  ```

---

## 1. System Health
- `GET /health`
  - Response: `200 OK`
  - Content:
    ```json
    {
      "status": "healthy",
      "environment": "development",
      "version": "0.1.0"
    }
    ```

---

## 2. Projects & Rooms
- `POST /api/v1/projects` — Create project
- `GET /api/v1/projects` — List projects for current user
- `GET /api/v1/projects/{project_id}` — Get single project details
- `PATCH /api/v1/projects/{project_id}` — Update project metadata
- `DELETE /api/v1/projects/{project_id}` — Delete project and associated scenes
- `POST /api/v1/projects/{project_id}/rooms` — Create or update rectangular room dimensions

---

## 3. Canonical Scenes & Validation
- `GET /api/v1/projects/{project_id}/scene`
  - Retrieves current canonical scene document and current revision.
- `PUT /api/v1/projects/{project_id}/scene`
  - Body:
    ```json
    {
      "expected_revision": 2,
      "scene": { ... canonical scene document ... }
    }
    ```
  - Response `200 OK`: Updated scene with incremented revision (`3`).
  - Response `409 Conflict`: If `expected_revision` does not match current server revision.
- `POST /api/v1/projects/{project_id}/scene/validate`
  - Authoritatively validates geometry, boundary containment, and catalog IDs without persisting.

---

## 4. Furniture Catalog
- `GET /api/v1/catalog`
  - Query params: `category`, `search`, `limit`, `offset`.
  - Returns paginated list of catalog items with dimensions and paise prices.
- `GET /api/v1/catalog/{item_id}`
  - Returns detail for a specific catalog item.

---

## 5. Budget & Estimates
- `POST /api/v1/projects/{project_id}/estimates`
  - Computes authoritative line items, GST amounts, and total paise for a specific scene revision.
- `GET /api/v1/projects/{project_id}/estimates`
  - Returns historical immutable estimates.
- `GET /api/v1/estimates/{estimate_id}`
  - Retrieves a specific estimate snapshot.

---

## 6. AI Layout Proposals
- `POST /api/v1/projects/{project_id}/ai-layout-proposals`
  - Body includes design preferences and constraints. Anchors proposal to current scene revision.
- `GET /api/v1/projects/{project_id}/ai-layout-proposals/{proposal_id}`
  - Retrieves proposal layout and validation outcome.
- `POST /api/v1/projects/{project_id}/ai-layout-proposals/{proposal_id}/apply`
  - Re-validates proposal against latest scene revision and commits change as a new revision.

---

## 7. PDF Reports
- `POST /api/v1/projects/{project_id}/reports`
  - Compiles project, furniture schedule, and estimate into a formal PDF report.
- `GET /api/v1/reports/{report_id}`
  - Downloads generated PDF with proper authorization.
