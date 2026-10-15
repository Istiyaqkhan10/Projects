# Product Requirements Document (PRD) — InteriorAI Studio

## 1. Executive Summary
**InteriorAI Studio** is an AI-assisted interior design web application tailored for the Indian market, operating in Indian Rupees (INR). It empowers homeowners, interior designers, and small studios to design rectangular rooms, place and rotate catalog furniture, visualize spaces in synchronized 2D and 3D, obtain transparent preliminary cost estimates, and generate AI-assisted furniture layout suggestions with strict geometry validation.

## 2. Target Users
- **Homeowners**: Planning renovations, room revamping, and budgeting furniture purchases.
- **Interior Designers & Freelancers**: Creating rapid client room layouts and preliminary estimates.
- **Small Design Studios**: Streamlining design options and exporting professional PDF proposals.

## 3. Scope & Milestones
- **MVP Features**:
  - Project management (CRUD, room dimensions in meters).
  - Rectangular room builder (width, length, height).
  - Furniture catalog browsing (dimensions, metadata, illustrative INR pricing).
  - Synchronized 2D canvas editor (drag, drop, rotate, delete) and 3D WebGL preview (orbit camera, perspective view).
  - Authoritative geometry validation (boundary containment, collision detection).
  - Transparent preliminary budget estimation (paise precision, GST assumptions, immutable snapshots).
  - AI layout generation (structured suggestions, preview before applying, revision anchoring).
  - PDF export of project, furniture, and budget summary.
- **Explicitly Deferred Beyond MVP**:
  - Real-time multi-user collaboration.
  - Arbitrary polygon room geometries.
  - Photo-to-3D reconstruction.
  - VR/AR immersive views.
  - Large retailer e-commerce integrations.

## 4. Key Constraints & Non-Functional Requirements
- **Geometry**: All internal coordinates and dimensions in meters ($m$).
- **Money**: Integer paise (1 INR = 100 paise), safe integer arithmetic.
- **Concurrency**: Optimistic locking with scene revision counters.
- **Security**: Server-side validation; AI output treated as untrusted input.
