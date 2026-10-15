# Deployment and CI/CD Specification — InteriorAI Studio

## 1. CI Pipeline Architecture
Every pull request and merge to `main` executes:
1. **Frontend Lint & Typecheck**: `npm run lint:web`, `npm run typecheck:web`
2. **Frontend Unit Tests**: `npm run test:web`
3. **Backend Lint & Static Checks**: `ruff check`, `mypy app`
4. **Backend Test Suite**: `pytest`
5. **Cross-Language Parity Check**: Validates that shared test fixtures in `packages/shared-fixtures` pass both frontend and backend schema checks.
6. **Container Build**: Multi-stage Docker builds for `apps/web` and `apps/api`.

## 2. Production Deployment
- **API**: Containerized FastAPI service running on Uvicorn behind Nginx or an Application Load Balancer.
- **Database**: Managed PostgreSQL (AWS RDS, Supabase, or self-hosted) with automated daily snapshots.
- **Web App**: Static SPA build deployed to CDN / object storage (Vercel, Cloudflare Pages, AWS S3+CloudFront).
- **Environment Isolation**: Separate `.env` configurations for Development, Staging, and Production.
