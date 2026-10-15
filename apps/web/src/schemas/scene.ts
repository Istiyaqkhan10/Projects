import { z } from "zod";

export const RoomDimensionsSchema = z.object({
  width_m: z.number().positive("Room width must be strictly positive"),
  length_m: z.number().positive("Room length must be strictly positive"),
  height_m: z.number().positive("Room height must be strictly positive"),
});

export const ObjectPositionSchema = z.object({
  x_m: z.number(),
  y_m: z.number().default(0.0),
  z_m: z.number(),
});

export const ObjectDimensionsSchema = z.object({
  width_m: z.number().positive("Furniture width must be strictly positive"),
  depth_m: z.number().positive("Furniture depth must be strictly positive"),
  height_m: z.number().positive("Furniture height must be strictly positive"),
});

export const SceneObjectSchema = z.object({
  instance_id: z.string().min(1, "Instance ID cannot be empty"),
  catalog_item_id: z.string().min(1, "Catalog Item ID cannot be empty"),
  position: ObjectPositionSchema,
  rotation_y_deg: z.number().default(0.0).transform((deg) => deg % 360),
  dimensions: ObjectDimensionsSchema,
});

export const LightingSchemeSchema = z.object({
  temperature_k: z.number().int().default(3000),
  ambient_intensity: z.number().default(0.7),
  directional_intensity: z.number().default(1.0),
  ceiling_fixtures: z.array(z.string()).default(["cove", "recessed"]),
});

export const RoomStylingSchema = z.object({
  wall_color: z.string().default("#FAF7F2"),
  accent_wall_color: z.string().nullable().default("#C2410C"),
  accent_wall_index: z.number().int().min(0).max(3).default(0),
  floor_material: z.string().default("hardwood_teak"),
  lighting: LightingSchemeSchema.default({
    temperature_k: 3000,
    ambient_intensity: 0.7,
    directional_intensity: 1.0,
    ceiling_fixtures: ["cove", "recessed"],
  }),
  theme_name: z.string().nullable().default("Warm Contemporary"),
});

export const CanonicalSceneSchema = z.object({
  schema_version: z.number().int().min(1).default(1),
  units: z.literal("m").default("m"),
  room: RoomDimensionsSchema,
  styling: RoomStylingSchema.optional(),
  objects: z.array(SceneObjectSchema).default([]),
});

export type RoomDimensions = z.infer<typeof RoomDimensionsSchema>;
export type LightingScheme = z.infer<typeof LightingSchemeSchema>;
export type RoomStyling = z.infer<typeof RoomStylingSchema>;
export type ObjectPosition = z.infer<typeof ObjectPositionSchema>;
export type ObjectDimensions = z.infer<typeof ObjectDimensionsSchema>;
export type SceneObject = z.infer<typeof SceneObjectSchema>;
export type CanonicalScene = z.infer<typeof CanonicalSceneSchema>;

