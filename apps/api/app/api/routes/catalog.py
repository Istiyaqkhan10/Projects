import json

from fastapi import APIRouter, HTTPException, Query

from app.core.config import get_shared_fixtures_dir
from app.schemas.catalog import CatalogItemResponse

router = APIRouter()

# Path to shared fixtures sample catalog items
FIXTURES_PATH = get_shared_fixtures_dir() / "validation-cases" / "sample_catalog_items.json"


def load_fixtures_catalog() -> list[dict]:
    if FIXTURES_PATH.exists():
        with open(FIXTURES_PATH, encoding="utf-8") as f:
            return json.load(f)
    return []


@router.get("", response_model=list[CatalogItemResponse])
async def list_catalog(
    category: str | None = Query(None, description="Filter by furniture category"),
    search: str | None = Query(None, description="Search query for furniture name/description"),
) -> list[CatalogItemResponse]:
    """
    Returns furniture catalog items with dimensions and paise pricing.
    """
    items = load_fixtures_catalog()
    if category:
        items = [i for i in items if i.get("category", "").lower() == category.lower()]
    if search:
        s = search.lower()
        items = [i for i in items if s in i.get("name", "").lower() or s in (i.get("description") or "").lower()]
    return [CatalogItemResponse(**item) for item in items]


@router.get("/{item_id}", response_model=CatalogItemResponse)
async def get_catalog_item(item_id: str) -> CatalogItemResponse:
    """
    Returns single catalog item by ID.
    """
    items = load_fixtures_catalog()
    for item in items:
        if item.get("id") == item_id:
            return CatalogItemResponse(**item)
    raise HTTPException(status_code=404, detail=f"Catalog item '{item_id}' not found")
