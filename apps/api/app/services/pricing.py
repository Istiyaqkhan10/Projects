from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class EstimateLineItem(BaseModel):
    instance_id: str
    catalog_item_id: str
    name: str
    quantity: int = Field(..., ge=1)
    unit_price_paise: int = Field(..., ge=0)
    line_total_paise: int = Field(..., ge=0)


class EstimateSnapshot(BaseModel):
    subtotal_paise: int
    gst_rate_percent: float = 18.0
    cgst_paise: int
    sgst_paise: int
    tax_paise: int
    total_paise: int
    currency: str = "INR"
    lines: List[EstimateLineItem]
    assumptions: str = (
        "Preliminary estimate based on illustrative catalog prices. "
        "Includes standard 18% GST (9% CGST + 9% SGST). "
        "Excludes custom site carpentry, electrical conduit, and final delivery logistics."
    )


def calculate_estimate(
    scene_objects: List[Dict[str, Any]],
    catalog_prices: Dict[str, Dict[str, Any]],
) -> EstimateSnapshot:
    """
    Computes preliminary financial estimate in integer paise using exact arithmetic.
    """
    subtotal_paise = 0
    lines: List[EstimateLineItem] = []

    for obj in scene_objects:
        cid = obj["catalog_item_id"]
        instance_id = obj["instance_id"]
        item_info = catalog_prices.get(cid, {})
        name = item_info.get("name", f"Catalog Item {cid}")
        unit_price = int(item_info.get("price_paise", 0))

        line_total = unit_price * 1  # 1 instance
        subtotal_paise += line_total

        lines.append(
            EstimateLineItem(
                instance_id=instance_id,
                catalog_item_id=cid,
                name=name,
                quantity=1,
                unit_price_paise=unit_price,
                line_total_paise=line_total,
            )
        )

    # 18% GST calculation with integer round-half-up
    # 9% CGST = subtotal * 9 / 100
    cgst_paise = (subtotal_paise * 900 + 5000) // 10000
    sgst_paise = (subtotal_paise * 900 + 5000) // 10000
    tax_paise = cgst_paise + sgst_paise
    total_paise = subtotal_paise + tax_paise

    return EstimateSnapshot(
        subtotal_paise=subtotal_paise,
        cgst_paise=cgst_paise,
        sgst_paise=sgst_paise,
        tax_paise=tax_paise,
        total_paise=total_paise,
        currency="INR",
        lines=lines,
    )
