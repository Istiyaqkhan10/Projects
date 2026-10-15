import React from "react";
import {
  Sliders,
  Maximize2,
  Trash2,
  RotateCw,
  AlertTriangle,
  Move,
  Compass,
} from "lucide-react";
import { CanonicalScene, SceneObject } from "../../schemas/scene";
import { checkObjectBoundary, snapToGrid } from "../../utils/geometry";

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
      {/* Selected Furniture Inspector */}
      {selectedObject ? (
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

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-[11px] text-gray-500 flex items-start space-x-2">
            <Maximize2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span>Select any furniture in the room to edit position, rotation, or inspect dimensions.</span>
          </div>
        </div>
      )}
    </aside>
  );
};
