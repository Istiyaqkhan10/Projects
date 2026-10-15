# AI Integration Specification — InteriorAI Studio

## 1. Principles
- **Untrusted Input**: All LLM / AI outputs are treated as completely untrusted raw input.
- **Strict Schema Enforcement**: The AI must return structured JSON strictly conforming to a defined proposal schema.
- **No Direct Mutation**: The AI cannot directly write to database tables or alter project state.
- **Explicit User Preview & Confirmation**: The user must visually preview the proposal, see validation results (clashes, clearances), and explicitly confirm before application.
- **Revision Anchoring**: Every proposal is tied to `base_scene_revision`. Applying a proposal re-validates against the current room revision to prevent race conditions.

## 2. Input to AI
- Room dimensions: width, length, height.
- Existing furniture IDs and positions (if rearranging).
- Allowable catalog items (with dimensions and IDs).
- User prompt (e.g., "Cozy modern living room with space for 4 guests").

## 3. Output Schema
```json
{
  "explanation": "Arranged sofa facing the focal wall with coffee table centered.",
  "suggested_objects": [
    {
      "catalog_item_id": "cat-sofa-3seater",
      "position": { "x_m": 2.5, "y_m": 0.0, "z_m": 1.2 },
      "rotation_y_deg": 0.0
    }
  ]
}
```
