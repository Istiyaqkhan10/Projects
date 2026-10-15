# Project Structure Specification — InteriorAI Studio

## Repository Layout

```
InteriorAI Studio/
  ├── README.md                           # Main setup and developer handbook
  ├── .gitignore                          # Root ignore patterns
  ├── .env.example                        # Root fake-placeholder environment definitions
  ├── docker-compose.yml                  # Local development stack (PostgreSQL, API, Web)
  ├── package.json                        # Monorepo workspaces definition
  │
  ├── apps/
  │   ├── web/                            # React + Vite + TypeScript frontend
  │   │   ├── package.json
  │   │   ├── index.html
  │   │   ├── vite.config.ts
  │   │   ├── tsconfig.json
  │   │   ├── src/
  │   │   │   ├── main.tsx                # Application bootstrap
  │   │   │   ├── App.tsx                 # Root layout & routing
  │   │   │   ├── components/             # Reusable UI primitives (buttons, modals, forms)
  │   │   │   ├── features/               # Domain feature modules
  │   │   │   │   ├── projects/           # Project CRUD & listing
  │   │   │   │   ├── room-editor/        # 2D Canvas & 3D Three.js viewports
  │   │   │   │   ├── furniture-catalog/  # Catalog browsing & filtering
  │   │   │   │   ├── budget/             # Cost breakdowns & estimate snapshots
  │   │   │   │   ├── ai-layout/          # AI prompt input & proposal preview
  │   │   │   │   └── reports/            # PDF generation & downloads
  │   │   │   ├── hooks/                  # React custom hooks
  │   │   │   ├── services/               # HTTP client & API communications
  │   │   │   ├── schemas/                # Zod schemas (canonical scene, catalog)
  │   │   │   ├── state/                  # State management store
  │   │   │   ├── styles/                 # Tailwind CSS & global styling
  │   │   │   ├── utils/                  # Geometry & formatting helpers
  │   │   │   └── tests/                  # Vitest component & schema tests
  │   │
  │   └── api/                            # Python FastAPI backend
  │       ├── pyproject.toml              # Python package metadata & dependencies
  │       ├── requirements.txt            # Pinned requirements
  │       ├── alembic.ini                 # Migration configuration
  │       ├── migrations/                 # Alembic migration scripts
  │       │   ├── env.py
  │       │   ├── script.py.mako
  │       │   └── versions/
  │       └── app/
  │           ├── main.py                 # FastAPI application factory
  │           ├── core/                   # Configuration, security, logging
  │           ├── api/routes/             # HTTP endpoints (health, projects, catalog, etc.)
  │           ├── models/                 # SQLAlchemy ORM models
  │           ├── schemas/                # Pydantic schemas (scene, catalog, estimate)
  │           ├── services/               # Domain services (geometry, pricing, validation)
  │           ├── repositories/           # Database access layer
  │           ├── db/                     # Database engine & session management
  │           └── tests/                  # pytest unit & integration tests
  │
  ├── packages/
  │   └── shared-fixtures/                # Cross-language test fixtures
  │       ├── scene-examples/             # Canonical scene JSONs (valid, boundary clash)
  │       └── validation-cases/           # Sample catalog items & price fixtures
  │
  └── docs/                               # Architectural & operational documentation
      ├── PRD.md
      ├── PROJECT_STRUCTURE.md
      ├── UI_UX_SPEC.md
      ├── DATA_MODEL.md
      ├── API_SPEC.md
      ├── EDITOR_GEOMETRY_SPEC.md
      ├── BUDGET_PRICING_SPEC.md
      ├── AI_INTEGRATION_SPEC.md
      ├── TESTING_QA_PLAN.md
      ├── SECURITY_PRIVACY.md
      ├── SETUP_AND_INSTALLATION.md
      ├── DEPLOYMENT_CI_CD.md
      └── adr/                            # Architecture Decision Records
          ├── 0001-coordinate-system.md
          ├── 0002-money-and-pricing.md
          └── 0003-scene-versioning.md
```
