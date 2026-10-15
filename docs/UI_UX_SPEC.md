# UI/UX Specification — InteriorAI Studio

## 1. Screens & Navigation Flow
1. **Projects Dashboard**: Grid of user projects with room dimensions, last modified date, and quick action to create or open projects.
2. **Project Setup Modal**: Name, description, and initial rectangular room dimensions (Width, Length, Height in meters).
3. **Design Studio (Main Editor)**:
   - **Top Navigation Bar**: Project Title, Current Scene Revision indicator, Save Status (saved/saving/unsaved/conflict), View Switcher (2D Plan / 3D Perspective / Split View), Export PDF trigger.
   - **Left Sidebar**: Furniture Catalog with search bar, category tabs (Seating, Tables, Storage, Beds, Decor), item cards with dimensions ($W \times D \times H$) and illustrative INR price.
   - **Center Canvas**: Interactive 2D floorplan canvas (pan, zoom, grid in 0.5m increments, wall boundary display) or 3D WebGL viewport (orbit, pan, perspective camera).
   - **Right Inspector Panel**: Selected item properties (exact $X, Z$ coordinates in meters, rotation angle in degrees, delete button, boundary clash status).
   - **Bottom Summary Dock**: Real-time preliminary estimate summary (Subtotal, GST, Total INR) with expand toggle for full line-item breakdown.
4. **AI Proposal Review Drawer**: Side-by-side or ghost overlay showing proposed furniture layout, explanation of trade-offs, clash validation banner, and explicit "Apply Proposal" / "Discard" buttons.
5. **Estimate & Report Modal**: Detailed itemized budget table with quantity, unit rate, line total, GST breakdown, download PDF button.

## 2. Accessibility & Quality Principles
- Explicit focus indicators on all inputs and buttons.
- Minimum contrast ratio 4.5:1 for typography.
- Keyboard shortcuts for rotation (e.g. 'R' key) and deletion ('Delete' / 'Backspace').
- Clear visual alerts for boundary violations (red outline) vs. safe placement (green/neutral outline).
