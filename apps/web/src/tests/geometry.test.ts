import { describe, it, expect } from "vitest";
import {
  getOrientedBoundingBoxCorners,
  checkObjectBoundary,
  snapToGrid,
  getWallDistances,
} from "../utils/geometry";
import { SceneObject } from "../schemas/scene";

describe("geometry utilities", () => {
  const testObject: SceneObject = {
    instance_id: "test-sofa",
    catalog_item_id: "cat-sofa-3seater",
    position: { x_m: 2.0, y_m: 0.0, z_m: 1.5 },
    rotation_y_deg: 0,
    dimensions: { width_m: 2.0, depth_m: 1.0, height_m: 0.8 },
  };

  it("calculates correct corners for unrotated furniture", () => {
    const corners = getOrientedBoundingBoxCorners(testObject);
    expect(corners).toHaveLength(4);
    // Center at (2.0, 1.5), width 2.0 (hw=1.0), depth 1.0 (hd=0.5)
    // Corners: (1, 1), (3, 1), (3, 2), (1, 2)
    expect(corners[0].x).toBeCloseTo(1.0);
    expect(corners[0].z).toBeCloseTo(1.0);
    expect(corners[1].x).toBeCloseTo(3.0);
    expect(corners[1].z).toBeCloseTo(1.0);
    expect(corners[2].x).toBeCloseTo(3.0);
    expect(corners[2].z).toBeCloseTo(2.0);
    expect(corners[3].x).toBeCloseTo(1.0);
    expect(corners[3].z).toBeCloseTo(2.0);
  });

  it("calculates correct corners for furniture rotated by 90 degrees", () => {
    const rotatedObj = { ...testObject, rotation_y_deg: 90 };
    const corners = getOrientedBoundingBoxCorners(rotatedObj);
    expect(corners).toHaveLength(4);
    // Width and depth swap orientations
    const xs = corners.map((c) => c.x);
    const zs = corners.map((c) => c.z);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(1.0);
    expect(Math.max(...zs) - Math.min(...zs)).toBeCloseTo(2.0);
  });

  it("detects valid placement inside room", () => {
    const check = checkObjectBoundary(testObject, 5.0, 4.0);
    expect(check.isInside).toBe(true);
    expect(check.errors).toHaveLength(0);
  });

  it("detects boundary breach when object extends beyond room", () => {
    const outsideObj = {
      ...testObject,
      position: { x_m: 4.8, y_m: 0.0, z_m: 1.5 }, // 4.8 + 1.0 = 5.8 > room width 5.0
    };
    const check = checkObjectBoundary(outsideObj, 5.0, 4.0);
    expect(check.isInside).toBe(false);
    expect(check.errors.some((e) => e.includes("Breaches right wall"))).toBe(true);
  });

  it("snaps coordinates accurately to grid", () => {
    expect(snapToGrid(2.14, 0.1)).toBeCloseTo(2.1);
    expect(snapToGrid(2.16, 0.1)).toBeCloseTo(2.2);
    expect(snapToGrid(2.023, 0.05)).toBeCloseTo(2.0);
    expect(snapToGrid(2.048, 0.05)).toBeCloseTo(2.05);
  });

  it("calculates wall distances accurately", () => {
    const distances = getWallDistances(testObject, 5.0, 4.0);
    // Left: minX = 1.0 => 1.0
    // Right: 5.0 - maxX (3.0) => 2.0
    // Front: minZ = 1.0 => 1.0
    // Back: 4.0 - maxZ (2.0) => 2.0
    expect(distances.left).toBeCloseTo(1.0);
    expect(distances.right).toBeCloseTo(2.0);
    expect(distances.front).toBeCloseTo(1.0);
    expect(distances.back).toBeCloseTo(2.0);
  });
});
