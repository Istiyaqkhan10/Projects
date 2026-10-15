import { describe, it, expect } from "vitest";
import sampleCatalogItems from "../../../../packages/shared-fixtures/validation-cases/sample_catalog_items.json";
import { CatalogItemSchema } from "../schemas/catalog";

describe("CatalogItemSchema", () => {
  it("successfully parses the shared sample catalog items fixture", () => {
    for (const item of sampleCatalogItems) {
      const res = CatalogItemSchema.safeParse(item);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.currency).toBe("INR");
        expect(res.data.price_paise).toBeGreaterThanOrEqual(0);
        expect(res.data.width_m).toBeGreaterThan(0);
      }
    }
  });

  it("rejects negative pricing in paise", () => {
    const invalidItem = {
      ...sampleCatalogItems[0],
      price_paise: -500,
    };
    const res = CatalogItemSchema.safeParse(invalidItem);
    expect(res.success).toBe(false);
  });
});
