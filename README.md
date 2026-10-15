# InteriorAI Studio

AI-powered interior design web application tailored for the Indian market (INR), featuring rectangular room modeling, synchronized 2D canvas and 3D Three.js rendering, authoritative backend geometry and pricing validation, and structured AI layout proposals.

---

## Architecture Overview

- **Frontend (`apps/web`)**: React 19, TypeScript, Vite, Tailwind CSS, Three.js / React Three Fiber, Zod validation, Vitest.
- **Backend (`apps/api`)**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2 (async), Alembic, PostgreSQL (with SQLite testing fallback), pytest.
- **Shared Contracts (`packages/shared-fixtures`)**: Shared JSON fixtures ensuring cross-language validation parity.
- **Documentation (`docs/`)**: Complete PRD, ADRs, and technical specifications.

---

## Quickstart

### Prerequisites
- Node.js v20+ & npm v10+
- Python 3.11+
- (Optional) Docker & Docker Compose

### 1. Clone & Configure
```bash
# Duplicate environment file
cp .env.example .env
```

### 2. Frontend Setup
```bash
# Install dependencies from root workspace
npm install

# Run frontend tests
npm run test:web

# Run frontend typecheck
npm run typecheck:web

# Start web dev server
npm run dev:web
```

### 3. Backend Setup
```bash
cd apps/api

# Create & activate virtual environment
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Run backend tests
pytest

# Start API server
uvicorn app.main:app --reload --port 8000
```

---

## Milestone Progress
- [x] **M0: Repository and Technical Foundation** (Current)
- [ ] **M1: Core Projects and Rooms**
- [ ] **M2: 2D Room Editor**
- [ ] **M3: 3D Visualization**
- [ ] **M4: Budget and Estimates**
- [ ] **M5: AI Layout Proposals**
- [ ] **M6: PDF Reports**
- [ ] **M7: Hardening and Deployment**

---

## License
Proprietary — All rights reserved.
