# Setup and Installation Guide — InteriorAI Studio

## Prerequisites
- Node.js (v20+ recommended, tested on Node v25.6.1)
- npm (v10+ or v11+)
- Python (v3.11+ recommended, tested on Python 3.13.2)
- Docker & Docker Compose (optional for containerized PostgreSQL)

## Step-by-Step Installation

### 1. Repository Setup
```bash
cp .env.example .env
```

### 2. Frontend Setup (apps/web)
```bash
# Install frontend dependencies from workspace root
npm install

# Run frontend tests
npm run test:web

# Run frontend typecheck
npm run typecheck:web

# Run frontend development server
npm run dev:web
```

### 3. Backend Setup (apps/api)
```bash
# Navigate to apps/api
cd apps/api

# Create and activate virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend tests
pytest

# Start backend development server
uvicorn app.main:app --reload --port 8000
```

### 4. Running with Docker Compose (PostgreSQL & Full Stack)
```bash
docker compose up -d postgres
```
