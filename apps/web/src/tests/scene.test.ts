import { describe, it, expect } from "vitest";
import validLivingRoom from "../../../../packages/shared-fixtures/scene-examples/valid_living_room.json";
import { CanonicalSceneSchema, RoomDimensionsSchema } from "../schemas/scene";

describe("CanonicalSceneSchema", () => {
  it("successfully parses the shared valid_living_room fixture", () => {
    const result = CanonicalSceneSchema.safeParse(validLivingRoom);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.units).toBe("m");
      expect(result.data.room.width_m).toBe(5.0);
      expect(result.data.room.length_m).toBe(4.0);
      expect(result.data.objects).toHaveLength(2);
      expect(result.data.objects[0].instance_id).toBe("obj-sofa-01");
    }
  });

  it("rejects non-positive room dimensions", () => {
    const invalidRoom = { width_m: -2.0, length_m: 4.0, height_m: 2.8 };
    const res = RoomDimensionsSchema.safeParse(invalidRoom);
    expect(res.success).toBe(false);
  });

  it("normalizes rotation angles modulo 360", () => {
    const modified = {
      ...validLivingRoom,
      objects: [
        {
          ...validLivingRoom.objects[0],
          rotation_y_deg: 450,
        },
      ],
    };
    const res = CanonicalSceneSchema.safeParse(modified);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.objects[0].rotation_y_deg).toBe(90);
    }
  });
});
