import React from "react";
import { SceneObject } from "../../schemas/scene";
import { checkObjectBoundary } from "../../utils/geometry";

interface FurnitureMesh3DProps {
  obj: SceneObject;
  isSelected: boolean;
  roomWidth: number;
  roomLength: number;
  onSelect: () => void;
}

export const FurnitureMesh3D: React.FC<FurnitureMesh3DProps> = ({
  obj,
  isSelected,
  roomWidth,
  roomLength,
  onSelect,
}) => {
  const boundaryStatus = checkObjectBoundary(obj, roomWidth, roomLength);
  const isClashing = !boundaryStatus.isInside;

  // Position: relative to room center
  const posX = obj.position.x_m - roomWidth / 2;
  const posY = obj.position.y_m;
  const posZ = obj.position.z_m - roomLength / 2;

  // Rotation: Y degrees to radians
  const rotY = -(obj.rotation_y_deg * Math.PI) / 180;

  const w = obj.dimensions.width_m;
  const d = obj.dimensions.depth_m;
  const h = obj.dimensions.height_m;

  const cid = obj.catalog_item_id.toLowerCase();
  const isSofa = cid.includes("sofa") || cid.includes("seating") || cid.includes("chair");
  const isTable = cid.includes("table") || cid.includes("desk");
  const isBed = cid.includes("bed");

  // Selection & clash colors
  const mainColor = isClashing
    ? "#e11d48"
    : isSelected
    ? "#ea580c"
    : isSofa
    ? "#475569"
    : isTable
    ? "#78350f"
    : isBed
    ? "#334155"
    : "#64748b";

  const accentColor = isClashing
    ? "#fda4af"
    : isSelected
    ? "#fdba74"
    : isSofa
    ? "#94a3b8"
    : isTable
    ? "#92400e"
    : isBed
    ? "#e2e8f0"
    : "#94a3b8";

  return (
    <group
      position={[posX, posY, posZ]}
      rotation={[0, rotY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* 1. SOFA MESH */}
      {isSofa && (
        <group>
          {/* Seat Base */}
          <mesh position={[0, h * 0.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, h * 0.4, d]} />
            <meshStandardMaterial color={mainColor} roughness={0.7} />
          </mesh>
          {/* Backrest (along back edge -Z) */}
          <mesh position={[0, h * 0.65, d * 0.35]} castShadow receiveShadow>
            <boxGeometry args={[w, h * 0.6, d * 0.3]} />
            <meshStandardMaterial color={accentColor} roughness={0.7} />
          </mesh>
          {/* Left Armrest */}
          <mesh position={[-w * 0.45, h * 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[w * 0.12, h * 0.5, d]} />
            <meshStandardMaterial color={mainColor} roughness={0.7} />
          </mesh>
          {/* Right Armrest */}
          <mesh position={[w * 0.45, h * 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[w * 0.12, h * 0.5, d]} />
            <meshStandardMaterial color={mainColor} roughness={0.7} />
          </mesh>
        </group>
      )}

      {/* 2. TABLE MESH */}
      {isTable && (
        <group>
          {/* Tabletop slab */}
          <mesh position={[0, h - 0.04, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, 0.06, d]} />
            <meshStandardMaterial color={mainColor} roughness={0.4} />
          </mesh>
          {/* 4 Corner Legs */}
          {[-w / 2 + 0.05, w / 2 - 0.05].map((lx, i) =>
            [-d / 2 + 0.05, d / 2 - 0.05].map((lz, j) => (
              <mesh
                key={`${i}-${j}`}
                position={[lx, (h - 0.06) / 2, lz]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[0.05, h - 0.06, 0.05]} />
                <meshStandardMaterial color={accentColor} roughness={0.6} />
              </mesh>
            ))
          )}
        </group>
      )}

      {/* 3. BED MESH */}
      {isBed && (
        <group>
          {/* Bed Base / Frame */}
          <mesh position={[0, h * 0.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, h * 0.35, d]} />
            <meshStandardMaterial color={mainColor} roughness={0.8} />
          </mesh>
          {/* Headboard (at -Z back) */}
          <mesh position={[0, h * 0.55, -d * 0.45]} castShadow receiveShadow>
            <boxGeometry args={[w * 1.02, h * 0.9, 0.1]} />
            <meshStandardMaterial color={accentColor} roughness={0.7} />
          </mesh>
          {/* Mattress / Duvet */}
          <mesh position={[0, h * 0.45, 0.05]} castShadow receiveShadow>
            <boxGeometry args={[w * 0.92, h * 0.2, d * 0.85]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.9} />
          </mesh>
          {/* Pillows */}
          {[-w * 0.22, w * 0.22].map((px, idx) => (
            <mesh
              key={idx}
              position={[px, h * 0.58, -d * 0.3]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[w * 0.35, 0.1, d * 0.2]} />
              <meshStandardMaterial color="#ffffff" roughness={0.9} />
            </mesh>
          ))}
        </group>
      )}

      {/* 4. GENERIC / STORAGE FALLBACK */}
      {!isSofa && !isTable && !isBed && (
        <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial
            color={mainColor}
            roughness={0.5}
            metalness={0.1}
          />
        </mesh>
      )}

      {/* Selection Halo / Ring on Floor */}
      {isSelected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w + 0.15, d + 0.15]} />
          <meshBasicMaterial
            color="#ea580c"
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
    </group>
  );
};
