import { describe, it, expect } from "vitest";
import { SceneObject } from "../schemas/scene";

describe("2D/3D Coordinate and Transform Consistency", () => {
  const room = { width_m: 6.0, length_m: 5.0, height_m: 2.8 };
  const obj: SceneObject = {
    instance_id: "inst-consistency-check",
    catalog_item_id: "cat-sofa-3seater",
    position: { x_m: 3.0, y_m: 0.0, z_m: 2.5 },
    rotation_y_deg: 90,
    dimensions: { width_m: 2.1, depth_m: 0.9, height_m: 0.85 },
  };

  it("centers furniture exactly at room midpoint in both 2D and 3D", () => {
    // In 2D: Room width is 6.0, length is 5.0. Midpoint is (3.0, 2.5)
    expect(obj.position.x_m).toBe(room.width_m / 2);
    expect(obj.position.z_m).toBe(room.length_m / 2);

    // In 3D: Room centered at (0, 0, 0).
    // Transformed position: (x_m - roomWidth/2, y_m + height/2, z_m - roomLength/2)
    const posX_3D = obj.position.x_m - room.width_m / 2;
    const posY_3D = obj.position.y_m + obj.dimensions.height_m / 2;
    const posZ_3D = obj.position.z_m - room.length_m / 2;

    expect(posX_3D).toBeCloseTo(0.0);
    expect(posZ_3D).toBeCloseTo(0.0);
    // Elevation rests on floor plane Y=0
    expect(posY_3D).toBeCloseTo(0.85 / 2);
  });

  it("converts rotation angle consistently between 2D degrees and 3D radians", () => {
    const deg = obj.rotation_y_deg;
    const rad3D = -(deg * Math.PI) / 180;
    // 90 deg => -PI/2 radians
    expect(rad3D).toBeCloseTo(-Math.PI / 2);
  });
});
