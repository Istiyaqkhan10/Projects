import React, { useState } from "react";
import {
  Sliders,
  Trash2,
  RotateCw,
  AlertTriangle,
  Move,
  Compass,
  Palette,
  Sun,
  Camera,
  Layers,
  Sparkles,
} from "lucide-react";
import { CanonicalScene, RoomStyling, SceneObject } from "../../schemas/scene";
import { checkObjectBoundary, snapToGrid } from "../../utils/geometry";

interface InspectorPanelProps {
  scene: CanonicalScene;
  selectedInstanceId: string | null;
  onUpdateObject: (updated: SceneObject) => void;
  onRemoveObject: (instanceId: string) => void;
  onUpdateRoomDimensions: (width_m: number, length_m: number, height_m: number) => void;
  onUpdateStyling?: (styling: RoomStyling) => void;
  onOpenAIRoomEnhancer?: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  scene,
  selectedInstanceId,
  onUpdateObject,
  onRemoveObject,
  onUpdateRoomDimensions,
  onUpdateStyling,
  onOpenAIRoomEnhancer,
}) => {
  const [activeTab, setActiveTab] = useState<"furniture" | "styling">("furniture");

  const selectedObject = scene.objects.find((o) => o.instance_id === selectedInstanceId);

  const styling: RoomStyling = scene.styling ?? {
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
    theme_name: "Warm Contemporary",
  };

  const handleStylingChange = (patch: Partial<RoomStyling>) => {
    if (onUpdateStyling) {
      onUpdateStyling({
        ...styling,
        ...patch,
      });
    }
  };

  const handleLightingChange = (patch: Partial<NonNullable<RoomStyling["lighting"]>>) => {
    if (onUpdateStyling) {
      onUpdateStyling({
        ...styling,
        lighting: {
          ...(styling.lighting || {
            temperature_k: 3000,
            ambient_intensity: 0.7,
            directional_intensity: 1.0,
            ceiling_fixtures: ["cove", "recessed"],
          }),
          ...patch,
        },
      });
    }
  };

  const boundaryStatus = selectedObject
    ? checkObjectBoundary(selectedObject, scene.room.width_m, scene.room.length_m)
    : null;

  const handleCenterObject = () => {
    if (!selectedObject) return;
    onUpdateObject({
      ...selectedObject,
      position: {
        ...selectedObject.position,
        x_m: parseFloat((scene.room.width_m / 2).toFixed(2)),
        z_m: parseFloat((scene.room.length_m / 2).toFixed(2)),
      },
    });
  };

  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col h-full select-none p-4 overflow-y-auto">
      {/* Top Tab Switcher when furniture is selected */}
      {selectedObject && (
        <div className="flex border-b border-gray-200 mb-3 -mt-1 pb-2 space-x-1">
          <button
            onClick={() => setActiveTab("furniture")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center space-x-1 ${
              activeTab === "furniture"
                ? "bg-orange-50 text-orange-700 border border-orange-200 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>Furniture</span>
          </button>
          <button
            onClick={() => setActiveTab("styling")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center space-x-1 ${
              activeTab === "styling"
                ? "bg-orange-50 text-orange-700 border border-orange-200 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Finishes & Light</span>
          </button>
        </div>
      )}

      {/* Selected Furniture Inspector */}
      {selectedObject && activeTab === "furniture" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <span className="text-[10px] font-mono text-orange-600 uppercase font-semibold">
                Furniture Inspector
              </span>
              <h3 className="text-xs font-bold text-gray-900">{selectedObject.instance_id}</h3>
            </div>
            <button
              onClick={() => onRemoveObject(selectedObject.instance_id)}
              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              title="Remove object (Delete key)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Boundary Breach Alert */}
          {boundaryStatus && !boundaryStatus.isInside && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] space-y-1">
              <div className="flex items-center font-bold text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                <span>Boundary Breach</span>
              </div>
              <ul className="list-disc list-inside text-[10px] space-y-0.5 text-rose-700">
                {boundaryStatus.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Position on Floor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center">
                <Move className="w-3.5 h-3.5 mr-1 text-gray-400" />
                Position on Floor (m)
              </label>
              <button
                onClick={handleCenterObject}
                className="text-[10px] text-orange-600 hover:text-orange-700 font-medium"
              >
                Center
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-gray-500">X (Width)</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() =>
                        onUpdateObject({
                          ...selectedObject,
                          position: {
                            ...selectedObject.position,
                            x_m: parseFloat(snapToGrid(selectedObject.position.x_m - 0.1, 0.05).toFixed(2)),
                          },
                        })
                      }
                      className="px-1 text-[10px] bg-white border border-gray-200 rounded hover:bg-gray-100"
                    >
                      -
                    </button>
                    <button
                      onClick={() =>
                        onUpdateObject({
                          ...selectedObject,
                          position: {
                            ...selectedObject.position,
                            x_m: parseFloat(snapToGrid(selectedObject.position.x_m + 0.1, 0.05).toFixed(2)),
                          },
                        })
                      }
                      className="px-1 text-[10px] bg-white border border-gray-200 rounded hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={scene.room.width_m}
                  value={selectedObject.position.x_m}
                  onChange={(e) =>
                    onUpdateObject({
                      ...selectedObject,
                      position: {
                        ...selectedObject.position,
                        x_m: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-2 py-1 text-xs bg-white border border-gray-200 rounded font-mono font-medium"
                />
              </div>

              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-gray-500">Z (Length)</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() =>
                        onUpdateObject({
                          ...selectedObject,
                          position: {
                            ...selectedObject.position,
                            z_m: parseFloat(snapToGrid(selectedObject.position.z_m - 0.1, 0.05).toFixed(2)),
                          },
                        })
                      }
                      className="px-1 text-[10px] bg-white border border-gray-200 rounded hover:bg-gray-100"
                    >
                      -
                    </button>
                    <button
                      onClick={() =>
                        onUpdateObject({
                          ...selectedObject,
                          position: {
                            ...selectedObject.position,
                            z_m: parseFloat(snapToGrid(selectedObject.position.z_m + 0.1, 0.05).toFixed(2)),
                          },
                        })
                      }
                      className="px-1 text-[10px] bg-white border border-gray-200 rounded hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={scene.room.length_m}
                  value={selectedObject.position.z_m}
                  onChange={(e) =>
                    onUpdateObject({
                      ...selectedObject,
                      position: {
                        ...selectedObject.position,
                        z_m: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-2 py-1 text-xs bg-white border border-gray-200 rounded font-mono font-medium"
                />
              </div>
            </div>
          </div>

          {/* Rotation Controls */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center">
                <Compass className="w-3.5 h-3.5 mr-1 text-gray-400" />
                Rotation: {selectedObject.rotation_y_deg}°
              </label>
              <button
                onClick={() =>
                  onUpdateObject({
                    ...selectedObject,
                    rotation_y_deg: (selectedObject.rotation_y_deg + 45) % 360,
                  })
                }
                className="flex items-center text-[10px] text-orange-600 hover:text-orange-700 font-medium"
              >
                <RotateCw className="w-3 h-3 mr-0.5" />
                +45° [R]
              </button>
            </div>

            {/* Quick Angle Presets */}
            <div className="grid grid-cols-4 gap-1 mb-2">
              {[0, 90, 180, 270].map((deg) => (
                <button
                  key={deg}
                  onClick={() =>
                    onUpdateObject({
                      ...selectedObject,
                      rotation_y_deg: deg,
                    })
                  }
                  className={`py-1 text-[10px] font-mono rounded border transition-colors ${
                    selectedObject.rotation_y_deg === deg
                      ? "bg-orange-50 border-orange-400 text-orange-700 font-bold"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>

            <input
              type="range"
              min="0"
              max="359"
              step="5"
              value={selectedObject.rotation_y_deg}
              onChange={(e) =>
                onUpdateObject({
                  ...selectedObject,
                  rotation_y_deg: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-orange-600"
            />
          </div>

          {/* Physical Dimensions */}
          <div className="pt-2 border-t border-gray-100">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Dimensions & Catalog Ref
            </span>
            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs space-y-1">
              <div className="flex justify-between text-gray-600 font-mono">
                <span>Footprint:</span>
                <span className="font-semibold text-gray-900">
                  {selectedObject.dimensions.width_m}m × {selectedObject.dimensions.depth_m}m
                </span>
              </div>
              <div className="flex justify-between text-gray-600 font-mono">
                <span>Height:</span>
                <span className="font-semibold text-gray-900">
                  {selectedObject.dimensions.height_m}m
                </span>
              </div>
              <div className="flex justify-between text-gray-500 text-[10px] pt-1 border-t border-gray-200">
                <span>Catalog ID:</span>
                <span className="font-mono">{selectedObject.catalog_item_id}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Room Dimensions, Finishes & Lighting Architecture */
        <div className="space-y-5">
          {/* AI Photo Makeover Banner */}
          {onOpenAIRoomEnhancer && (
            <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200 rounded-xl space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-orange-950">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>AI Photo Room Makeover</span>
              </div>
              <p className="text-[11px] text-orange-800 leading-snug">
                Upload a real room photo to enhance wall colors, lighting atmosphere, and layout.
              </p>
              <button
                onClick={onOpenAIRoomEnhancer}
                className="w-full py-1.5 px-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>AI Photo Makeover</span>
              </button>
            </div>
          )}

          {/* 1. Wall Colors & Accent Wall */}
          <div className="space-y-3 pb-3 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-900 flex items-center">
              <Palette className="w-3.5 h-3.5 mr-1.5 text-orange-600" />
              Wall Colors & Paint
            </h3>

            {/* Base Wall Color */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-gray-700">Base Wall Paint</span>
                <span className="text-[10px] font-mono text-gray-500 uppercase">{styling.wall_color}</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={styling.wall_color}
                  onChange={(e) => handleStylingChange({ wall_color: e.target.value })}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                />
                <div className="flex space-x-1 flex-1">
                  {[
                    { name: "Linen", hex: "#FAF7F2" },
                    { name: "Off-White", hex: "#F8F9FA" },
                    { name: "Muted Sage", hex: "#E2E8E0" },
                    { name: "Warm Clay", hex: "#F5EBE6" },
                    { name: "Greige", hex: "#E5E7EB" },
                  ].map((preset) => (
                    <button
                      key={preset.hex}
                      onClick={() => handleStylingChange({ wall_color: preset.hex })}
                      className="w-6 h-6 rounded-full border border-gray-300 flex-shrink-0 hover:scale-110 transition-transform shadow-2xs"
                      style={{ backgroundColor: preset.hex }}
                      title={`${preset.name} (${preset.hex})`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Accent Wall */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-gray-700">Focal Accent Wall</span>
                <span className="text-[10px] font-mono text-gray-500 uppercase">
                  {styling.accent_wall_color || "None"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={styling.accent_wall_color || "#C2410C"}
                  onChange={(e) => handleStylingChange({ accent_wall_color: e.target.value })}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                />
                <div className="flex space-x-1 flex-1">
                  {[
                    { name: "Terracotta", hex: "#C2410C" },
                    { name: "Indigo", hex: "#1E293B" },
                    { name: "Emerald", hex: "#064E3B" },
                    { name: "Ochre", hex: "#D97706" },
                    { name: "Royal Navy", hex: "#1E3A8A" },
                  ].map((preset) => (
                    <button
                      key={preset.hex}
                      onClick={() => handleStylingChange({ accent_wall_color: preset.hex })}
                      className="w-6 h-6 rounded-full border border-gray-300 flex-shrink-0 hover:scale-110 transition-transform shadow-2xs"
                      style={{ backgroundColor: preset.hex }}
                      title={`${preset.name} (${preset.hex})`}
                    />
                  ))}
                </div>
              </div>

              {/* Accent Wall Placement */}
              <div className="mt-2 flex items-center space-x-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-500 font-medium px-1">Wall:</span>
                {[
                  { label: "Back", index: 0 },
                  { label: "Left", index: 1 },
                  { label: "Right", index: 2 },
                ].map((item) => (
                  <button
                    key={item.index}
                    onClick={() => handleStylingChange({ accent_wall_index: item.index })}
                    className={`flex-1 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                      styling.accent_wall_index === item.index
                        ? "bg-white text-orange-600 shadow-2xs"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Flooring Finishes */}
          <div className="space-y-2 pb-3 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-900 flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1.5 text-orange-600" />
              Floor Finish & Texture
            </h3>
            <select
              value={styling.floor_material}
              onChange={(e) => handleStylingChange({ floor_material: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-800 focus:ring-1 focus:ring-orange-500"
            >
              <option value="hardwood_teak">Hardwood Teak (Warm Golden Wood)</option>
              <option value="oak_parquet">Natural Oak Parquet (Light Blonde Wood)</option>
              <option value="white_marble">Polished Carrara Marble (Gloss White)</option>
              <option value="kota_stone">Honed Kota Stone (Cool Slate Green)</option>
              <option value="polished_concrete">Polished Concrete (Urban Grey)</option>
            </select>
          </div>

          {/* 3. Lighting Architecture (Kelvin Ambiance) */}
          <div className="space-y-3 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-900 flex items-center">
                <Sun className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                Lighting Architecture
              </h3>
              <span className="text-[11px] font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                {styling.lighting?.temperature_k ?? 3000}K
              </span>
            </div>

            {/* Quick Kelvin Presets */}
            <div className="grid grid-cols-4 gap-1">
              {[
                { k: 2700, label: "2700K Warm" },
                { k: 3000, label: "3000K Soft" },
                { k: 4000, label: "4000K Pure" },
                { k: 5000, label: "5000K Cool" },
              ].map((preset) => (
                <button
                  key={preset.k}
                  onClick={() => handleLightingChange({ temperature_k: preset.k })}
                  className={`py-1 text-[10px] font-medium rounded border transition-colors ${
                    (styling.lighting?.temperature_k ?? 3000) === preset.k
                      ? "bg-amber-100 border-amber-400 text-amber-800 font-bold"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Kelvin Slider */}
            <div>
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>2700K (Warm Amber)</span>
                <span>5000K (Daylight)</span>
              </div>
              <input
                type="range"
                min="2700"
                max="5000"
                step="100"
                value={styling.lighting?.temperature_k ?? 3000}
                onChange={(e) => handleLightingChange({ temperature_k: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Ambient Intensity */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-gray-600 mb-1">
                <span>Ambient Intensity</span>
                <span className="font-mono text-gray-900">
                  {(styling.lighting?.ambient_intensity ?? 0.7).toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.5"
                step="0.05"
                value={styling.lighting?.ambient_intensity ?? 0.7}
                onChange={(e) => handleLightingChange({ ambient_intensity: parseFloat(e.target.value) })}
                className="w-full accent-orange-600"
              />
            </div>
          </div>

          {/* 4. Room Dimensions */}
          <div className="space-y-3">
            <div className="pb-1">
              <h3 className="text-xs font-bold text-gray-900 flex items-center">
                <Sliders className="w-3.5 h-3.5 mr-1 text-gray-500" />
                Room Dimensions
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Adjust rectangular boundary in meters
              </p>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-medium text-gray-700 block mb-0.5">
                  Room Width (m)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="2.0"
                  max="30.0"
                  value={scene.room.width_m}
                  onChange={(e) =>
                    onUpdateRoomDimensions(
                      parseFloat(e.target.value) || 5.0,
                      scene.room.length_m,
                      scene.room.height_m
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg font-mono font-medium focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-700 block mb-0.5">
                  Room Length (m)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="2.0"
                  max="30.0"
                  value={scene.room.length_m}
                  onChange={(e) =>
                    onUpdateRoomDimensions(
                      scene.room.width_m,
                      parseFloat(e.target.value) || 4.0,
                      scene.room.height_m
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg font-mono font-medium focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-700 block mb-0.5">
                  Ceiling Height (m)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="2.0"
                  max="10.0"
                  value={scene.room.height_m}
                  onChange={(e) =>
                    onUpdateRoomDimensions(
                      scene.room.width_m,
                      scene.room.length_m,
                      parseFloat(e.target.value) || 2.8
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg font-mono font-medium focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
