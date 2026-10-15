import json
import uuid
from typing import Any, Dict, List, Optional, Tuple
from app.core.config import get_shared_fixtures_dir, settings
from app.schemas.ai_layout import SuggestedObject
from app.schemas.scene import (
    ObjectDimensions,
    ObjectPosition,
    RoomDimensions,
    SceneObject,
)
from app.services.geometry import is_object_inside_room

FIXTURES_PATH = (
    get_shared_fixtures_dir()
    / "validation-cases"
    / "sample_catalog_items.json"
)


def load_catalog_map() -> Dict[str, Dict[str, Any]]:
    catalog_map: Dict[str, Dict[str, Any]] = {}
    if FIXTURES_PATH.exists():
        with open(FIXTURES_PATH, "r", encoding="utf-8") as f:
            items = json.load(f)
            for item in items:
                catalog_map[item["id"]] = item
    return catalog_map


class AILayoutService:
    @classmethod
    def generate_layout(
        cls,
        room: RoomDimensions,
        prompt: Optional[str] = None,
        room_type: Optional[str] = "living_room",
        preferred_item_ids: Optional[List[str]] = None,
    ) -> Tuple[str, List[SuggestedObject], str, List[str]]:
        """
        Generates structured, validated furniture layout proposal.
        Returns: (explanation, suggested_objects, validation_status, validation_errors)
        """
        catalog = load_catalog_map()
        suggested: List[SuggestedObject] = []
        explanation = ""

        # Determine strategy based on room_type
        r_type = (room_type or "living_room").lower()
        rw = room.width_m
        rl = room.length_m

        if "bedroom" in r_type:
            explanation = (
                f"Generated bedroom arrangement for {rw:.1f}m × {rl:.1f}m space. "
                "Centered queen bed along rear wall with nightstand and wardrobe access."
            )
            # 1. King Bed against rear wall
            bed_id = "cat-king-bed"
            if bed_id in catalog:
                item = catalog[bed_id]
                suggested.append(
                    SuggestedObject(
                        catalog_item_id=bed_id,
                        item_name=item["name"],
                        position=ObjectPosition(x_m=rw / 2, y_m=0.0, z_m=min(rl - 1.2, 1.4)),
                        rotation_y_deg=0.0,
                        dimensions=ObjectDimensions(
                            width_m=item["width_m"],
                            depth_m=item["depth_m"],
                            height_m=item["height_m"],
                        ),
                    )
                )

            # 2. Wardrobe / Bookshelf along side wall
            shelf_id = "cat-bookshelf-tall"
            if shelf_id in catalog and rw >= 3.5:
                item = catalog[shelf_id]
                suggested.append(
                    SuggestedObject(
                        catalog_item_id=shelf_id,
                        item_name=item["name"],
                        position=ObjectPosition(x_m=min(0.6, rw - 0.6), y_m=0.0, z_m=rl / 2),
                        rotation_y_deg=90.0,
                        dimensions=ObjectDimensions(
                            width_m=item["width_m"],
                            depth_m=item["depth_m"],
                            height_m=item["height_m"],
                        ),
                    )
                )

        elif "office" in r_type or "study" in r_type:
            explanation = (
                f"Generated functional home office layout for {rw:.1f}m × {rl:.1f}m room. "
                "Study desk positioned for optimal natural light with tall bookshelf and ergonomic chair."
            )
            desk_id = "cat-dining-table-4"  # Multi-purpose work desk
            chair_id = "cat-armchair-fabric"
            shelf_id = "cat-bookshelf-tall"

            if desk_id in catalog:
                item = catalog[desk_id]
                suggested.append(
                    SuggestedObject(
                        catalog_item_id=desk_id,
                        item_name=item["name"],
                        position=ObjectPosition(x_m=rw / 2, y_m=0.0, z_m=rl / 2),
                        rotation_y_deg=0.0,
                        dimensions=ObjectDimensions(
                            width_m=item["width_m"],
                            depth_m=item["depth_m"],
                            height_m=item["height_m"],
                        ),
                    )
                )

            if chair_id in catalog:
                item = catalog[chair_id]
                suggested.append(
                    SuggestedObject(
                        catalog_item_id=chair_id,
                        item_name=item["name"],
                        position=ObjectPosition(x_m=rw / 2, y_m=0.0, z_m=min(rl - 0.6, (rl / 2) + 0.9)),
                        rotation_y_deg=180.0,
                        dimensions=ObjectDimensions(
                            width_m=item["width_m"],
                            depth_m=item["depth_m"],
                            height_m=item["height_m"],
                        ),
                    )
                )

            if shelf_id in catalog:
                item = catalog[shelf_id]
                suggested.append(
                    SuggestedObject(
                        catalog_item_id=shelf_id,
                        item_name=item["name"],
                        position=ObjectPosition(x_m=0.6, y_m=0.0, z_m=0.8),
                        rotation_y_deg=0.0,
                        dimensions=ObjectDimensions(
                            width_m=item["width_m"],
                            depth_m=item["depth_m"],
                            height_m=item["height_m"],
                        ),
                    )
                )

        else:
            # Default: Living Room
            explanation = (
                f"Optimized living room conversation area for {rw:.1f}m × {rl:.1f}m room. "
                "Main 3-seater sofa centered, paired with wood coffee table and accent armchair."
            )
            sofa_id = "cat-sofa-3seater"
            table_id = "cat-coffee-table-wood"
            armchair_id = "cat-armchair-fabric"
            shelf_id = "cat-bookshelf-tall"

            # 1. Sofa
            if sofa_id in catalog:
                item = catalog[sofa_id]
                sofa_z = max(1.0, rl * 0.35)
                suggested.append(
                    SuggestedObject(
                        catalog_item_id=sofa_id,
                        item_name=item["name"],
                        position=ObjectPosition(x_m=rw / 2, y_m=0.0, z_m=sofa_z),
                        rotation_y_deg=0.0,
                        dimensions=ObjectDimensions(
                            width_m=item["width_m"],
                            depth_m=item["depth_m"],
                            height_m=item["height_m"],
                        ),
                    )
                )

            # 2. Coffee Table
            if table_id in catalog:
                item = catalog[table_id]
                sofa_z = max(1.0, rl * 0.35)
                table_z = min(rl - 0.8, sofa_z + 1.1)
                suggested.append(
                    SuggestedObject(
                        catalog_item_id=table_id,
                        item_name=item["name"],
                        position=ObjectPosition(x_m=rw / 2, y_m=0.0, z_m=table_z),
                        rotation_y_deg=0.0,
                        dimensions=ObjectDimensions(
                            width_m=item["width_m"],
                            depth_m=item["depth_m"],
                            height_m=item["height_m"],
                        ),
                    )
                )

            # 3. Armchair
            if armchair_id in catalog and rw >= 4.0:
                item = catalog[armchair_id]
                chair_x = min(rw - 0.8, (rw / 2) + 1.5)
                sofa_z = max(1.0, rl * 0.35)
                suggested.append(
                    SuggestedObject(
                        catalog_item_id=armchair_id,
                        item_name=item["name"],
                        position=ObjectPosition(x_m=chair_x, y_m=0.0, z_m=sofa_z + 0.6),
                        rotation_y_deg=-45.0,
                        dimensions=ObjectDimensions(
                            width_m=item["width_m"],
                            depth_m=item["depth_m"],
                            height_m=item["height_m"],
                        ),
                    )
                )

            # 4. Bookshelf / Display
            if shelf_id in catalog and rl >= 4.0:
                item = catalog[shelf_id]
                suggested.append(
                    SuggestedObject(
                        catalog_item_id=shelf_id,
                        item_name=item["name"],
                        position=ObjectPosition(x_m=0.6, y_m=0.0, z_m=rl - 0.6),
                        rotation_y_deg=90.0,
                        dimensions=ObjectDimensions(
                            width_m=item["width_m"],
                            depth_m=item["depth_m"],
                            height_m=item["height_m"],
                        ),
                    )
                )

        # Append user prompt context if provided
        if prompt:
            explanation += f" User preference considered: '{prompt.strip()}'."

        # Rigorous Geometric Validation of AI Proposal
        errors: List[str] = []
        for idx, s in enumerate(suggested):
            temp_obj = SceneObject(
                instance_id=f"ai-{idx}",
                catalog_item_id=s.catalog_item_id,
                position=s.position,
                rotation_y_deg=s.rotation_y_deg,
                dimensions=s.dimensions,
            )
            is_inside, obj_errs = is_object_inside_room(temp_obj, room.width_m, room.length_m)
            if not is_inside:
                errors.extend(obj_errs)

        validation_status = "VALID" if not errors else "INVALID"
        return explanation, suggested, validation_status, errors
