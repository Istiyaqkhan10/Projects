# Testing and QA Plan — InteriorAI Studio

## 1. Testing Philosophy
- Real test execution only: never claim tests passed without running them.
- Cross-language parity tests: Ensure TypeScript (Zod) and Python (Pydantic) accept valid shared fixtures and reject boundary clash fixtures identically.
- Geometry edge cases: Overlapping items, zero/negative room dimensions, boundary grazing, rotations at 45°/90°/180°/270°.
- Financial precision tests: Verify exact paise math, 18% GST rounding, zero floating-point drift.

## 2. Test Suites
- **Frontend**: Vitest + React Testing Library (`npm run test:web`)
  - Schema validation unit tests (`scene.test.ts`, `catalog.test.ts`)
  - Component rendering tests
- **Backend**: pytest (`pytest`)
  - Health check test (`test_health.py`)
  - Pydantic schema validation tests (`test_scene_schema.py`, `test_catalog_schema.py`)
  - Boundary and collision geometry tests
  - Revision conflict tests
