# Security and Privacy — InteriorAI Studio

## 1. Secrets Management
- No actual production API keys or tokens are stored in source code.
- `.env.example` contains only clearly marked placeholders.
- Frontend bundles only receive variables prefixed with `VITE_` and never server-side secrets.

## 2. Authentication & Authorization
- Ownership validation on all project, room, scene, estimate, and report resources.
- Passwords hashed using bcrypt/Argon2.
- JWT tokens with short expiry and secure rotation.

## 3. Data Protection & Input Sanitization
- All client inputs validated via Zod on frontend and Pydantic on backend.
- Rate limiting on computationally expensive endpoints (AI layouts, PDF generation).
- File uploads constrained by type and maximum size limits.
