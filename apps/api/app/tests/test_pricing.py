from app.services.pricing import calculate_estimate


def test_pricing_calculation():
    scene_objects = [
        {"instance_id": "inst-1", "catalog_item_id": "cat-sofa-3seater"},
        {"instance_id": "inst-2", "catalog_item_id": "cat-coffee-table-wood"},
    ]
    catalog_prices = {
        "cat-sofa-3seater": {"name": "Sofa", "price_paise": 3499900},
        "cat-coffee-table-wood": {"name": "Coffee Table", "price_paise": 1149900},
    }

    estimate = calculate_estimate(scene_objects, catalog_prices)

    expected_subtotal = 3499900 + 1149900  # 4649800 paise = ₹46,498.00
    assert estimate.subtotal_paise == expected_subtotal

    # CGST 9%: (4649800 * 900 + 5000) // 10000 = 418482 paise
    expected_cgst = 418482
    expected_sgst = 418482
    expected_tax = expected_cgst + expected_sgst
    expected_total = expected_subtotal + expected_tax

    assert estimate.cgst_paise == expected_cgst
    assert estimate.sgst_paise == expected_sgst
    assert estimate.tax_paise == expected_tax
    assert estimate.total_paise == expected_total
    assert estimate.currency == "INR"
    assert len(estimate.lines) == 2
