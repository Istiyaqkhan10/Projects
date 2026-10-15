import json
from pathlib import Path
import pytest
from pydantic import ValidationError
from app.schemas.catalog import CatalogItemCreate, CatalogItemResponse

FIXTURE_PATH = (
    Path(__file__).resolve().parents[4]
    / "packages"
    / "shared-fixtures"
    / "validation-cases"
    / "sample_catalog_items.json"
)


def test_catalog_items_fixture():
    assert FIXTURE_PATH.exists(), f"Fixture not found at {FIXTURE_PATH}"
    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        items = json.load(f)

    assert len(items) >= 2
    for raw in items:
        item = CatalogItemResponse(**raw)
        assert item.price_paise >= 0
        assert item.currency == "INR"
        assert item.width_m > 0
        assert item.depth_m > 0
        assert item.height_m > 0


def test_invalid_negative_price():
    with pytest.raises(ValidationError):
        CatalogItemCreate(
            id="cat-invalid",
            name="Invalid Sofa",
            category="seating",
            width_m=2.0,
            depth_m=1.0,
            height_m=0.8,
            price_paise=-100,  # Negative not allowed
        )
