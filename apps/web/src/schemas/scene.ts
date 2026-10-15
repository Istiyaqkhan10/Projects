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

export const CanonicalSceneSchema = z.object({
  schema_version: z.number().int().min(1).default(1),
  units: z.literal("m").default("m"),
  room: RoomDimensionsSchema,
  objects: z.array(SceneObjectSchema).default([]),
});

export type RoomDimensions = z.infer<typeof RoomDimensionsSchema>;
export type ObjectPosition = z.infer<typeof ObjectPositionSchema>;
export type ObjectDimensions = z.infer<typeof ObjectDimensionsSchema>;
export type SceneObject = z.infer<typeof SceneObjectSchema>;
export type CanonicalScene = z.infer<typeof CanonicalSceneSchema>;
