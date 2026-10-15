import { SceneObject } from "../schemas/scene";

export interface Point2D {
  x: number;
  z: number;
}

/**
 * Computes the 4 corners of an oriented bounding box (OBB) on the XZ floor plane in meters.
 * Matching the exact formula from docs/EDITOR_GEOMETRY_SPEC.md & backend geometry.py
 */
export function getOrientedBoundingBoxCorners(obj: SceneObject): Point2D[] {
  const xc = obj.position.x_m;
  const zc = obj.position.z_m;
  const hw = obj.dimensions.width_m / 2.0;
  const hd = obj.dimensions.depth_m / 2.0;

  const theta = (obj.rotation_y_deg * Math.PI) / 180.0;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  const localCorners: [number, number][] = [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ];

  return localCorners.map(([dx, dz]) => ({
    x: xc + (dx * cosT - dz * sinT),
    z: zc + (dx * sinT + dz * cosT),
  }));
}

/**
 * Validates whether all 4 corners of the rotated furniture footprint reside strictly
 * within the room boundary: X in [0, roomWidthM] and Z in [0, roomLengthM].
 */
export function checkObjectBoundary(
  obj: SceneObject,
  roomWidthM: number,
  roomLengthM: number,
  tolerance = 0.001
): { isInside: boolean; errors: string[] } {
  const corners = getOrientedBoundingBoxCorners(obj);
  const errors: string[] = [];

  for (let i = 0; i < corners.length; i++) {
    const { x, z } = corners[i];
    if (x < -tolerance) {
      errors.push(`Breaches left wall (X=${x.toFixed(2)}m < 0)`);
    } else if (x > roomWidthM + tolerance) {
      errors.push(`Breaches right wall (X=${x.toFixed(2)}m > ${roomWidthM.toFixed(2)}m)`);
    }

    if (z < -tolerance) {
      errors.push(`Breaches front wall (Z=${z.toFixed(2)}m < 0)`);
    } else if (z > roomLengthM + tolerance) {
      errors.push(`Breaches back wall (Z=${z.toFixed(2)}m > ${roomLengthM.toFixed(2)}m)`);
    }
  }

  return {
    isInside: errors.length === 0,
    errors,
  };
}

/**
 * Snaps a metric value to a defined grid increment in meters (e.g., 0.1m or 0.05m).
 */
export function snapToGrid(value: number, step = 0.1): number {
  return Math.round(value / step) * step;
}

/**
 * Calculates distances to room walls from the closest points on the object footprint.
 */
export function getWallDistances(
  obj: SceneObject,
  roomWidthM: number,
  roomLengthM: number
): { left: number; right: number; front: number; back: number } {
  const corners = getOrientedBoundingBoxCorners(obj);
  const minX = Math.min(...corners.map((c) => c.x));
  const maxX = Math.max(...corners.map((c) => c.x));
  const minZ = Math.min(...corners.map((c) => c.z));
  const maxZ = Math.max(...corners.map((c) => c.z));

  return {
    left: parseFloat(minX.toFixed(2)),
    right: parseFloat((roomWidthM - maxX).toFixed(2)),
    front: parseFloat(minZ.toFixed(2)),
    back: parseFloat((roomLengthM - maxZ).toFixed(2)),
  };
}
