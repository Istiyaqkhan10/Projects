import React from "react";
import { CanonicalScene, SceneObject } from "../../schemas/scene";

interface Room2DCanvasProps {
  scene: CanonicalScene;
  selectedInstanceId: string | null;
  onSelectObject: (id: string | null) => void;
}

export const Room2DCanvas: React.FC<Room2DCanvasProps> = ({
  scene,
  selectedInstanceId,
  onSelectObject,
}) => {
  const { room, objects } = scene;

  // Scale: pixels per meter
  const pixelsPerMeter = 80;
  const paddingMeters = 0.5;

  const canvasWidth = (room.width_m + paddingMeters * 2) * pixelsPerMeter;
  const canvasHeight = (room.length_m + paddingMeters * 2) * pixelsPerMeter;

  const roomOriginX = paddingMeters * pixelsPerMeter;
  const roomOriginZ = paddingMeters * pixelsPerMeter;
  const roomPixelWidth = room.width_m * pixelsPerMeter;
  const roomPixelLength = room.length_m * pixelsPerMeter;

  // Grid steps: every 0.5m
  const gridLines = [];
  for (let x = 0; x <= room.width_m; x += 0.5) {
    const px = roomOriginX + x * pixelsPerMeter;
    gridLines.push(
      <line
        key={`vx-${x}`}
        x1={px}
        y1={roomOriginZ}
        x2={px}
        y2={roomOriginZ + roomPixelLength}
        stroke="#f0f0f0"
        strokeWidth="1"
      />
    );
  }
  for (let z = 0; z <= room.length_m; z += 0.5) {
    const pz = roomOriginZ + z * pixelsPerMeter;
    gridLines.push(
      <line
        key={`hz-${z}`}
        x1={roomOriginX}
        y1={pz}
        x2={roomOriginX + roomPixelWidth}
        y2={pz}
        stroke="#f0f0f0"
        strokeWidth="1"
      />
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-gray-50 overflow-auto">
      <div className="mb-2 text-xs font-mono text-gray-500 flex space-x-4">
        <span>Room: {room.width_m.toFixed(2)}m (W) × {room.length_m.toFixed(2)}m (L) × {room.height_m.toFixed(2)}m (H)</span>
        <span>• Grid: 0.5m</span>
        <span>• Canonical Units: Meters</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <svg
          width={canvasWidth}
          height={canvasHeight}
          className="select-none"
          onClick={() => onSelectObject(null)}
        >
          {/* Grid */}
          {gridLines}

          {/* Room Boundary Walls */}
          <rect
            x={roomOriginX}
            y={roomOriginZ}
            width={roomPixelWidth}
            height={roomPixelLength}
            fill="#fafafa"
            stroke="#262626"
            strokeWidth="3"
            rx="2"
          />

          {/* Room Dimension Labels */}
          <text
            x={roomOriginX + roomPixelWidth / 2}
            y={roomOriginZ - 10}
            textAnchor="middle"
            className="text-xs font-mono fill-gray-600 font-semibold"
          >
            {room.width_m.toFixed(2)} m
          </text>
          <text
            x={roomOriginX - 12}
            y={roomOriginZ + roomPixelLength / 2}
            textAnchor="middle"
            transform={`rotate(-90 ${roomOriginX - 12} ${roomOriginZ + roomPixelLength / 2})`}
            className="text-xs font-mono fill-gray-600 font-semibold"
          >
            {room.length_m.toFixed(2)} m
          </text>

          {/* Furniture Objects */}
          {objects.map((obj: SceneObject) => {
            const isSelected = selectedInstanceId === obj.instance_id;
            const cx = roomOriginX + obj.position.x_m * pixelsPerMeter;
            const cz = roomOriginZ + obj.position.z_m * pixelsPerMeter;
            const pw = obj.dimensions.width_m * pixelsPerMeter;
            const pd = obj.dimensions.depth_m * pixelsPerMeter;

            return (
              <g
                key={obj.instance_id}
                transform={`translate(${cx}, ${cz}) rotate(${obj.rotation_y_deg})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectObject(obj.instance_id);
                }}
                className="cursor-pointer transition-all"
              >
                {/* Furniture Body */}
                <rect
                  x={-pw / 2}
                  y={-pd / 2}
                  width={pw}
                  height={pd}
                  rx="4"
                  fill={isSelected ? "#fed7aa" : "#e2e8f0"}
                  stroke={isSelected ? "#ea580c" : "#64748b"}
                  strokeWidth={isSelected ? "2.5" : "1.5"}
                />

                {/* Heading indicator (indicates front of furniture) */}
                <line
                  x1={0}
                  y1={0}
                  x2={0}
                  y2={-pd / 2 + 6}
                  stroke={isSelected ? "#c2410c" : "#475569"}
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Label */}
                <text
                  x={0}
                  y={4}
                  textAnchor="middle"
                  className="text-[10px] font-sans font-medium fill-gray-800 pointer-events-none"
                >
                  {obj.catalog_item_id.replace("cat-", "")}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
