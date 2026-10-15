import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { CanonicalScene, SceneObject } from "../../schemas/scene";

interface Room3DViewportProps {
  scene: CanonicalScene;
  selectedInstanceId: string | null;
  onSelectObject: (id: string | null) => void;
}

const FurnitureMesh: React.FC<{
  obj: SceneObject;
  isSelected: boolean;
  roomWidth: number;
  roomLength: number;
  onSelect: () => void;
}> = ({ obj, isSelected, roomWidth, roomLength, onSelect }) => {
  // Canonical origin is at corner (0, 0, 0).
  // In Three.js, center the room around origin (0, 0, 0)
  const posX = obj.position.x_m - roomWidth / 2;
  const posY = obj.position.y_m + obj.dimensions.height_m / 2;
  const posZ = obj.position.z_m - roomLength / 2;

  // Convert rotation_y_deg to radians
  const rotY = -(obj.rotation_y_deg * Math.PI) / 180;

  return (
    <group
      position={[posX, posY, posZ]}
      rotation={[0, rotY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry
          args={[
            obj.dimensions.width_m,
            obj.dimensions.height_m,
            obj.dimensions.depth_m,
          ]}
        />
        <meshStandardMaterial
          color={isSelected ? "#ea580c" : "#94a3b8"}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
};

export const Room3DViewport: React.FC<Room3DViewportProps> = ({
  scene,
  selectedInstanceId,
  onSelectObject,
}) => {
  const { room, objects } = scene;

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden">
      <div className="absolute top-3 left-3 z-10 bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded text-xs font-mono text-slate-300 pointer-events-none">
        3D Perspective View • Orbit: Left Click • Pan: Right Click • Zoom: Scroll
      </div>

      <Canvas
        shadows
        camera={{ position: [5, 6, 6], fov: 45 }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            onSelectObject(null);
          }
        }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <Suspense fallback={null}>
          {/* Floor plane */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[room.width_m, room.length_m]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
          </mesh>

          {/* Grid on Floor */}
          <Grid
            position={[0, 0.001, 0]}
            args={[room.width_m, room.length_m]}
            cellSize={0.5}
            cellThickness={1}
            cellColor="#cbd5e1"
            sectionSize={1.0}
            sectionThickness={1.5}
            sectionColor="#94a3b8"
            fadeDistance={20}
          />

          {/* Furniture objects */}
          {objects.map((obj) => (
            <FurnitureMesh
              key={obj.instance_id}
              obj={obj}
              isSelected={selectedInstanceId === obj.instance_id}
              roomWidth={room.width_m}
              roomLength={room.length_m}
              onSelect={() => onSelectObject(obj.instance_id)}
            />
          ))}
        </Suspense>

        <OrbitControls makeDefault minDistance={2} maxDistance={25} maxPolarAngle={Math.PI / 2 - 0.05} />
      </Canvas>
    </div>
  );
};
