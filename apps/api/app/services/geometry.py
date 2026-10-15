import math
from typing import List, Tuple
from app.schemas.scene import CanonicalScene, SceneObject


def get_oriented_bounding_box_corners(obj: SceneObject) -> List[Tuple[float, float]]:
    """
    Computes the 4 corners of the object's footprint in the XZ floor plane,
    accounting for position (center) and rotation_y_deg.
    """
    xc = obj.position.x_m
    zc = obj.position.z_m
    hw = obj.dimensions.width_m / 2.0
    hd = obj.dimensions.depth_m / 2.0

    # Convert rotation_y_deg to radians
    theta = math.radians(obj.rotation_y_deg)
    cos_t = math.cos(theta)
    sin_t = math.sin(theta)

    # Local half-extents relative to center
    local_corners = [
        (-hw, -hd),
        (hw, -hd),
        (hw, hd),
        (-hw, hd),
    ]

    world_corners = []
    for dx, dz in local_corners:
        wx = xc + (dx * cos_t - dz * sin_t)
        wz = zc + (dx * sin_t + dz * cos_t)
        world_corners.append((wx, wz))

    return world_corners


def is_object_inside_room(obj: SceneObject, room_width_m: float, room_length_m: float, tolerance: float = 1e-4) -> Tuple[bool, List[str]]:
    """
    Checks if all 4 corners of the rotated object footprint are inside the room boundaries.
    Floor boundary: X in [0, room_width_m], Z in [0, room_length_m].
    """
    corners = get_oriented_bounding_box_corners(obj)
    errors = []

    for idx, (x, z) in enumerate(corners):
        if x < -tolerance:
            errors.append(f"Object '{obj.instance_id}' corner {idx} breaches left wall (X={x:.3f} < 0)")
        elif x > room_width_m + tolerance:
            errors.append(f"Object '{obj.instance_id}' corner {idx} breaches right wall (X={x:.3f} > {room_width_m:.3f})")

        if z < -tolerance:
            errors.append(f"Object '{obj.instance_id}' corner {idx} breaches front wall (Z={z:.3f} < 0)")
        elif z > room_length_m + tolerance:
            errors.append(f"Object '{obj.instance_id}' corner {idx} breaches back wall (Z={z:.3f} > {room_length_m:.3f})")

    return (len(errors) == 0, errors)


def validate_scene_geometry(scene: CanonicalScene) -> Tuple[bool, List[str]]:
    """
    Validates boundary containment for all furniture objects in the canonical scene.
    """
    all_errors: List[str] = []

    if scene.room.width_m <= 0 or scene.room.length_m <= 0 or scene.room.height_m <= 0:
        all_errors.append("Room dimensions must be strictly positive.")

    for obj in scene.objects:
        is_inside, errors = is_object_inside_room(obj, scene.room.width_m, scene.room.length_m)
        if not is_inside:
            all_errors.extend(errors)

    return (len(all_errors) == 0, all_errors)
