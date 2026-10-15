# ADR 0001: Room and Furniture Coordinate System

## Status
Accepted

## Context
InteriorAI Studio requires real-time 2D floorplan editing and 3D WebGL scene visualization synchronized from a single canonical scene document. Different engines and frameworks use different coordinate systems (e.g., SVG canvas uses 2D screen pixels with Y pointing down, whereas Three.js uses a 3D right-handed Cartesian coordinate system with Y pointing up). Furthermore, geometric boundary checking and collision detection must be consistent between the frontend presentation layer and the backend authoritative validation service.

## Decision
1. **Canonical Units**: All spatial dimensions (room width, length, height; furniture bounding box width, depth, height) and positions must be stored and manipulated in **meters** ($m$) as standard IEEE-754 finite floating-point numbers.
2. **Axis Conventions**:
   - **X-axis**: Room width (horizontal axis across the floor plane, $X \in [0, \text{width\_m}]$).
   - **Y-axis**: Vertical elevation from the finished floor level ($Y = 0$ is the floor plane; objects rest on floor where $Y = 0$ unless elevated).
   - **Z-axis**: Room length/depth (depth axis across the floor plane, $Z \in [0, \text{length\_m}]$).
3. **Room Origin**: The origin $(0, 0, 0)$ is fixed at the bottom-left corner of the rectangular room on the floor plane.
4. **Object Pivot & Footprint**:
   - The reference pivot point of each furniture piece is defined at its bottom center (or bounded center on the floor plane $Y=0$).
   - Rotations are applied along the vertical Y-axis (`rotation_y_deg`) in degrees at the API boundary ($[0, 360)$) and converted consistently to radians in Three.js and trigonometric backend checks.
   - For rotated objects, collision and boundary validation must use 2D Oriented Bounding Boxes (OBB) or axis-aligned bounding projections in the $X-Z$ plane, rather than simplistic unrotated bounding boxes.
5. **Presentation Layer**: Screen-pixel conversions in the 2D SVG canvas are strictly presentation transforms with a defined scale factor (e.g., pixels per meter) and do not mutate canonical coordinates.

## Consequences
- Canonical scenes are completely portable and decoupled from screen resolution or rendering client.
- 2D floor plans and 3D renders remain strictly synchronized with zero data duplication.
- Geometry validation on the backend can deterministically reject any object placement that breaches room boundaries or collides with other furniture.
