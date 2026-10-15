import { z } from "zod";

export const CatalogItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  manufacturer: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  width_m: z.number().positive(),
  depth_m: z.number().positive(),
  height_m: z.number().positive(),
  price_paise: z.number().int().nonnegative("Price in paise cannot be negative"),
  currency: z.literal("INR").default("INR"),
  asset_reference: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
  source_verified_at: z.string().nullable().optional(),
  license_information: z.string().default("Illustrative Demonstration Data"),
  is_active: z.boolean().default(true),
});

export type CatalogItem = z.infer<typeof CatalogItemSchema>;
