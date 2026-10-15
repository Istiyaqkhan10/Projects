import React, { useState, useRef, useEffect, useCallback } from "react";
import { CanonicalScene, SceneObject } from "../../schemas/scene";
import {
  checkObjectBoundary,
  getWallDistances,
  snapToGrid,
} from "../../utils/geometry";

interface Room2DCanvasProps {
  scene: CanonicalScene;
  selectedInstanceId: string | null;
  onSelectObject: (id: string | null) => void;
  onUpdateObject: (updated: SceneObject) => void;
  onRemoveObject: (id: string) => void;
}

export const Room2DCanvas: React.FC<Room2DCanvasProps> = ({
  scene,
  selectedInstanceId,
  onSelectObject,
  onUpdateObject,
  onRemoveObject,
}) => {
  const { room, objects } = scene;
  const svgRef = useRef<SVGSVGElement>(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; z: number } | null>(null);
  const [dragObjectStartPos, setDragObjectStartPos] = useState<{ x: number; z: number } | null>(null);

  // Rotating state
  const [isRotating, setIsRotating] = useState(false);

  // Scale: pixels per meter
  const pixelsPerMeter = 80;
  const paddingMeters = 0.5;

  const canvasWidth = (room.width_m + paddingMeters * 2) * pixelsPerMeter;
  const canvasHeight = (room.length_m + paddingMeters * 2) * pixelsPerMeter;

  const roomOriginX = paddingMeters * pixelsPerMeter;
  const roomOriginZ = paddingMeters * pixelsPerMeter;
  const roomPixelWidth = room.width_m * pixelsPerMeter;
  const roomPixelLength = room.length_m * pixelsPerMeter;

  // Selected object reference
  const selectedObject = objects.find((o) => o.instance_id === selectedInstanceId) || null;

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (!selectedObject) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onRemoveObject(selectedObject.instance_id);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        onUpdateObject({
          ...selectedObject,
          rotation_y_deg: (selectedObject.rotation_y_deg + 45) % 360,
        });
      } else if (e.key === "Escape") {
        onSelectObject(null);
      } else if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 0.5 : 0.1;
        let dx = 0;
        let dz = 0;
        if (e.key === "ArrowLeft") dx = -step;
        if (e.key === "ArrowRight") dx = step;
        if (e.key === "ArrowUp") dz = -step;
        if (e.key === "ArrowDown") dz = step;

        onUpdateObject({
          ...selectedObject,
          position: {
            ...selectedObject.position,
            x_m: parseFloat(snapToGrid(selectedObject.position.x_m + dx, 0.05).toFixed(2)),
            z_m: parseFloat(snapToGrid(selectedObject.position.z_m + dz, 0.05).toFixed(2)),
          },
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedObject, onRemoveObject, onUpdateObject, onSelectObject]);

  // Convert client pointer coordinate to metric floorplane (x_m, z_m)
  const clientToMeters = useCallback(
    (clientX: number, clientY: number): { x_m: number; z_m: number } | null => {
      if (!svgRef.current) return null;
      const rect = svgRef.current.getBoundingClientRect();
      const svgX = clientX - rect.left;
      const svgZ = clientY - rect.top;

      const x_m = (svgX - roomOriginX) / pixelsPerMeter;
      const z_m = (svgZ - roomOriginZ) / pixelsPerMeter;
      return { x_m, z_m };
    },
    [roomOriginX, roomOriginZ, pixelsPerMeter]
  );

  // Pointer Move Handler (Dragging & Rotating)
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!selectedObject) return;

    const coords = clientToMeters(e.clientX, e.clientY);
    if (!coords) return;

    if (isDragging && dragStartPos && dragObjectStartPos) {
      const deltaX = coords.x_m - dragStartPos.x;
      const deltaZ = coords.z_m - dragStartPos.z;

      const rawX = dragObjectStartPos.x + deltaX;
      const rawZ = dragObjectStartPos.z + deltaZ;

      const newX = parseFloat(snapToGrid(rawX, 0.1).toFixed(2));
      const newZ = parseFloat(snapToGrid(rawZ, 0.1).toFixed(2));

      if (newX !== selectedObject.position.x_m || newZ !== selectedObject.position.z_m) {
        onUpdateObject({
          ...selectedObject,
          position: {
            ...selectedObject.position,
            x_m: newX,
            z_m: newZ,
          },
        });
      }
    } else if (isRotating) {
      // Calculate angle from object center to pointer
      const dx = coords.x_m - selectedObject.position.x_m;
      const dz = coords.z_m - selectedObject.position.z_m;

      // In SVG: X is right, Z is down. Standard rotation angle:
      let angleDeg = Math.round((Math.atan2(dx, -dz) * 180) / Math.PI);
      if (angleDeg < 0) angleDeg += 360;

      // Snap to 15 degrees if shift held, else 5 degrees
      const snapDeg = e.shiftKey ? 15 : 5;
      const finalDeg = Math.round(angleDeg / snapDeg) * snapDeg % 360;

      if (finalDeg !== selectedObject.rotation_y_deg) {
        onUpdateObject({
          ...selectedObject,
          rotation_y_deg: finalDeg,
        });
      }
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setIsRotating(false);
    setDragStartPos(null);
    setDragObjectStartPos(null);
  };

  // Generate 0.5m grid lines
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
        stroke="#f1f5f9"
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
        stroke="#f1f5f9"
        strokeWidth="1"
      />
    );
  }

  // Selected object measurements
  const wallDistances = selectedObject
    ? getWallDistances(selectedObject, room.width_m, room.length_m)
    : null;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-gray-50 overflow-auto">
      {/* Canvas Top Bar */}
      <div className="mb-2 text-xs font-mono text-gray-500 flex space-x-4 items-center">
        <span>Room: {room.width_m.toFixed(2)}m (W) × {room.length_m.toFixed(2)}m (L)</span>
        <span>• Grid: 0.1m snap</span>
        <span className="hidden sm:inline">• Shortcuts: [R] Rotate 45° • [Del] Remove • [Arrows] Nudge</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 relative">
        <svg
          ref={svgRef}
          width={canvasWidth}
          height={canvasHeight}
          className="select-none cursor-default"
          onClick={() => onSelectObject(null)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Grid */}
          {gridLines}

          {/* Room Boundary Walls */}
          <rect
            x={roomOriginX}
            y={roomOriginZ}
            width={roomPixelWidth}
            height={roomPixelLength}
            fill="#ffffff"
            stroke="#1e293b"
            strokeWidth="3.5"
            rx="2"
          />

          {/* Dimension indicators on room edges */}
          <text
            x={roomOriginX + roomPixelWidth / 2}
            y={roomOriginZ - 10}
            textAnchor="middle"
            className="text-xs font-mono fill-slate-700 font-semibold"
          >
            {room.width_m.toFixed(2)} m (Width)
          </text>
          <text
            x={roomOriginX - 14}
            y={roomOriginZ + roomPixelLength / 2}
            textAnchor="middle"
            transform={`rotate(-90 ${roomOriginX - 14} ${roomOriginZ + roomPixelLength / 2})`}
            className="text-xs font-mono fill-slate-700 font-semibold"
          >
            {room.length_m.toFixed(2)} m (Length)
          </text>

          {/* Measurement guidelines for selected object */}
          {selectedObject && wallDistances && (
            <g className="pointer-events-none">
              {/* Distance to left wall */}
              <line
                x1={roomOriginX}
                y1={roomOriginZ + selectedObject.position.z_m * pixelsPerMeter}
                x2={roomOriginX + (selectedObject.position.x_m - selectedObject.dimensions.width_m / 2) * pixelsPerMeter}
                y2={roomOriginZ + selectedObject.position.z_m * pixelsPerMeter}
                stroke="#f97316"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={roomOriginX + 8}
                y={roomOriginZ + selectedObject.position.z_m * pixelsPerMeter - 4}
                className="text-[9px] font-mono fill-orange-600 font-semibold"
              >
                {wallDistances.left}m
              </text>

              {/* Distance to right wall */}
              <line
                x1={roomOriginX + (selectedObject.position.x_m + selectedObject.dimensions.width_m / 2) * pixelsPerMeter}
                y1={roomOriginZ + selectedObject.position.z_m * pixelsPerMeter}
                x2={roomOriginX + roomPixelWidth}
                y2={roomOriginZ + selectedObject.position.z_m * pixelsPerMeter}
                stroke="#f97316"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={roomOriginX + roomPixelWidth - 36}
                y={roomOriginZ + selectedObject.position.z_m * pixelsPerMeter - 4}
                className="text-[9px] font-mono fill-orange-600 font-semibold"
              >
                {wallDistances.right}m
              </text>
            </g>
          )}

          {/* Furniture Objects */}
          {objects.map((obj: SceneObject) => {
            const isSelected = selectedInstanceId === obj.instance_id;
            const boundaryStatus = checkObjectBoundary(obj, room.width_m, room.length_m);
            const isClashing = !boundaryStatus.isInside;

            const cx = roomOriginX + obj.position.x_m * pixelsPerMeter;
            const cz = roomOriginZ + obj.position.z_m * pixelsPerMeter;
            const pw = obj.dimensions.width_m * pixelsPerMeter;
            const pd = obj.dimensions.depth_m * pixelsPerMeter;

            return (
              <g
                key={obj.instance_id}
                transform={`translate(${cx}, ${cz}) rotate(${obj.rotation_y_deg})`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSelectObject(obj.instance_id);

                  const coords = clientToMeters(e.clientX, e.clientY);
                  if (coords) {
                    setIsDragging(true);
                    setDragStartPos({ x: coords.x_m, z: coords.z_m });
                    setDragObjectStartPos({
                      x: obj.position.x_m,
                      z: obj.position.z_m,
                    });
                  }
                }}
                className="cursor-move"
              >
                {/* Furniture Body */}
                <rect
                  x={-pw / 2}
                  y={-pd / 2}
                  width={pw}
                  height={pd}
                  rx="4"
                  fill={
                    isClashing
                      ? "#ffe4e6"
                      : isSelected
                      ? "#ffedd5"
                      : "#f1f5f9"
                  }
                  stroke={
                    isClashing
                      ? "#e11d48"
                      : isSelected
                      ? "#ea580c"
                      : "#64748b"
                  }
                  strokeWidth={isClashing || isSelected ? "2.5" : "1.5"}
                />

                {/* Heading indicator (indicates front of furniture) */}
                <line
                  x1={0}
                  y1={0}
                  x2={0}
                  y2={-pd / 2 + 6}
                  stroke={isClashing ? "#be123c" : isSelected ? "#c2410c" : "#475569"}
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Furniture Label */}
                <text
                  x={0}
                  y={4}
                  textAnchor="middle"
                  className="text-[10px] font-sans font-semibold fill-slate-800 pointer-events-none"
                >
                  {obj.catalog_item_id.replace("cat-", "")}
                </text>

                {/* Clash Warning Icon */}
                {isClashing && (
                  <circle
                    cx={pw / 2 - 4}
                    cy={-pd / 2 + 4}
                    r="4"
                    fill="#e11d48"
                  />
                )}

                {/* Interactive Rotation Handle when Selected */}
                {isSelected && (
                  <g className="cursor-grab active:cursor-grabbing">
                    {/* Stem connecting object to rotation handle */}
                    <line
                      x1={0}
                      y1={-pd / 2}
                      x2={0}
                      y2={-pd / 2 - 20}
                      stroke="#ea580c"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                    {/* Rotation Knob */}
                    <circle
                      cx={0}
                      cy={-pd / 2 - 20}
                      r="6"
                      fill="#ea580c"
                      stroke="#ffffff"
                      strokeWidth="2"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setIsRotating(true);
                      }}
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
