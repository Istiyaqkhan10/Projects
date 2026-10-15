import React from "react";
import { Sliders, Maximize2, Trash2, RotateCw } from "lucide-react";
import { CanonicalScene, SceneObject } from "../../schemas/scene";

interface InspectorPanelProps {
  scene: CanonicalScene;
  selectedInstanceId: string | null;
  onUpdateObject: (updated: SceneObject) => void;
  onRemoveObject: (instanceId: string) => void;
  onUpdateRoomDimensions: (width_m: number, length_m: number, height_m: number) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  scene,
  selectedInstanceId,
  onUpdateObject,
  onRemoveObject,
  onUpdateRoomDimensions,
}) => {
  const selectedObject = scene.objects.find((o) => o.instance_id === selectedInstanceId);

  return (
    <aside className="w-72 bg-white border-l border-gray-200 flex flex-col h-full select-none p-4 overflow-y-auto">
      {/* Selected Furniture Inspector */}
      {selectedObject ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <span className="text-[10px] font-mono text-orange-600 uppercase">Selected Object</span>
              <h3 className="text-xs font-bold text-gray-900">{selectedObject.instance_id}</h3>
            </div>
            <button
              onClick={() => onRemoveObject(selectedObject.instance_id)}
              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors"
              title="Remove object"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Position Controls */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Position on Floor (Meters)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-gray-400">X (Width)</span>
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
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-400">Z (Length)</span>
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
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded font-mono"
                />
              </div>
            </div>
          </div>

          {/* Rotation Controls */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700">Rotation</label>
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
                +45°
              </button>
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
            <div className="text-right text-[10px] font-mono text-gray-500">
              {selectedObject.rotation_y_deg}°
            </div>
          </div>

          {/* Dimensions */}
          <div className="pt-2 border-t border-gray-100">
            <span className="text-[10px] text-gray-400 block mb-1">Dimensions</span>
            <div className="text-xs font-mono text-gray-600 bg-gray-50 p-2 rounded">
              W: {selectedObject.dimensions.width_m}m × D: {selectedObject.dimensions.depth_m}m × H:{" "}
              {selectedObject.dimensions.height_m}m
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="pb-3 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-900 flex items-center">
              <Sliders className="w-3.5 h-3.5 mr-1 text-gray-500" />
              Room Dimensions
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Adjust rectangular room boundary in meters
            </p>
          </div>

          <div className="space-y-3">
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
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded font-mono"
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
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded font-mono"
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
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded text-[11px] text-gray-500 flex items-start space-x-2">
            <Maximize2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span>Select any furniture in the room to edit position, rotation, or inspect dimensions.</span>
          </div>
        </div>
      )}
    </aside>
  );
};
