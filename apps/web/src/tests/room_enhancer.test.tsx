import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CanonicalSceneSchema, RoomStylingSchema } from "../schemas/scene";
import { AIRoomEnhancerModal } from "../features/room-enhancement/AIRoomEnhancerModal";
import { api } from "../services/api";

describe("RoomStylingSchema & CanonicalSceneSchema", () => {
  it("validates room styling defaults and custom values", () => {
    const defaultStyling = RoomStylingSchema.parse({});
    expect(defaultStyling.wall_color).toBe("#FAF7F2");
    expect(defaultStyling.accent_wall_color).toBe("#C2410C");
    expect(defaultStyling.accent_wall_index).toBe(0);
    expect(defaultStyling.floor_material).toBe("hardwood_teak");
    expect(defaultStyling.lighting.temperature_k).toBe(3000);
    expect(defaultStyling.lighting.ambient_intensity).toBe(0.7);

    const customScene = {
      schema_version: 1,
      units: "m",
      room: { width_m: 6.0, length_m: 5.0, height_m: 3.0 },
      styling: {
        wall_color: "#E2E8E0",
        accent_wall_color: "#1E3A8A",
        accent_wall_index: 1,
        floor_material: "white_marble",
        lighting: {
          temperature_k: 4000,
          ambient_intensity: 0.8,
          directional_intensity: 1.2,
          ceiling_fixtures: ["cove", "recessed", "pendant"],
        },
        theme_name: "Coastal Modern",
      },
      objects: [],
    };

    const res = CanonicalSceneSchema.safeParse(customScene);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.styling?.floor_material).toBe("white_marble");
      expect(res.data.styling?.lighting.temperature_k).toBe(4000);
      expect(res.data.styling?.theme_name).toBe("Coastal Modern");
    }
  });
});

describe("AIRoomEnhancerModal", () => {
  it("renders upload interface and sample presets when open", () => {
    render(
      <AIRoomEnhancerModal
        isOpen={true}
        onClose={vi.fn()}
        projectId="proj-123"
        projectName="Beach Villa Living"
        currentRevision={2}
        onEnhancementApplied={vi.fn()}
      />
    );

    expect(
      screen.getByText("AI Photo Room Enhancer & Makeover")
    ).toBeDefined();
    expect(screen.getByText(/Beach Villa Living/)).toBeDefined();
    expect(screen.getByText("Warm Living Room")).toBeDefined();
    expect(screen.getByText("Dim Bedroom")).toBeDefined();
    expect(screen.getByText("Bright Studio")).toBeDefined();
    expect(screen.getAllByText("Warm Contemporary").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Japandi Serenity").length).toBeGreaterThan(0);
  });

  it("enables analysis and displays proposal when sample is selected and analyzed", async () => {
    const mockResponse = {
      id: "enh-test-01",
      project_id: "proj-123",
      theme_title: "Warm Contemporary Sanctum",
      spatial_analysis: "High ambient light with optimal south-facing exposure.",
      design_rationale: "Rich teak hardwood with warm 3000K ambient illumination.",
      color_palette: [
        { role: "Primary Wall", name: "Warm Linen", hex: "#FAF7F2" },
        { role: "Focal Accent Wall", name: "Terracotta Rust", hex: "#C2410C" },
      ],
      lighting: {
        temperature_k: 3000,
        ambient_intensity: 0.7,
        directional_intensity: 1.0,
        ambiance_name: "Warm Halogen Soft White",
        recommended_fixtures: ["Recessed Downlights", "Warm Cove Strip"],
      },
      floor_material: "hardwood_teak",
      floor_name: "Hardwood Teak Flooring",
      styling: {
        wall_color: "#FAF7F2",
        accent_wall_color: "#C2410C",
        accent_wall_index: 0,
        floor_material: "hardwood_teak",
        lighting: {
          temperature_k: 3000,
          ambient_intensity: 0.7,
          directional_intensity: 1.0,
          ceiling_fixtures: ["cove", "recessed"],
        },
        theme_name: "Warm Contemporary Sanctum",
      },
      suggested_furniture: [
        {
          catalog_item_id: "cat-sofa-3s",
          item_name: "Modern 3-Seater Fabric Sofa",
          position: { x_m: 2.5, y_m: 0.0, z_m: 2.0 },
          rotation_y_deg: 0,
          dimensions: { width_m: 2.1, depth_m: 0.9, height_m: 0.85 },
        },
      ],
      enhanced_visualization_svg: "<svg><text>Concept</text></svg>",
      created_at: new Date().toISOString(),
    };

    const enhanceSpy = vi
      .spyOn(api, "enhanceRoomFromImage")
      .mockResolvedValueOnce(mockResponse);

    render(
      <AIRoomEnhancerModal
        isOpen={true}
        onClose={vi.fn()}
        projectId="proj-123"
        projectName="Beach Villa Living"
        currentRevision={2}
        onEnhancementApplied={vi.fn()}
      />
    );

    // Select sample preset
    fireEvent.click(screen.getByText("Warm Living Room"));

    // Click Analyze button
    const analyzeBtn = screen.getByText(
      "Analyze Photo & Generate Complete Room Makeover"
    );
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(enhanceSpy).toHaveBeenCalledTimes(1);
      expect(
        screen.getByText("Warm Contemporary Sanctum")
      ).toBeDefined();
      expect(
        screen.getByText("Apply Colors & Lighting Only (Preserve Furniture)")
      ).toBeDefined();
      expect(
        screen.getByText("Apply Full Interior Makeover")
      ).toBeDefined();
    });
  });
});
