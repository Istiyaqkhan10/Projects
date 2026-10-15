import React, { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Camera, Eye, Layers } from "lucide-react";
import { CanonicalScene } from "../../schemas/scene";
import { FurnitureMesh3D } from "./FurnitureMesh3D";

interface Room3DViewportProps {
  scene: CanonicalScene;
  selectedInstanceId: string | null;
  onSelectObject: (id: string | null) => void;
}

export const Room3DViewport: React.FC<Room3DViewportProps> = ({
  scene,
  selectedInstanceId,
  onSelectObject,
}) => {
  const { room, objects, styling } = scene;
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const wallThickness = 0.15;
  const wallHeight = room.height_m;

  // Floor Material Mapping
  const floorConfig = (styling?.floor_material && {
    hardwood_teak: { color: "#854d0e", roughness: 0.45, metalness: 0.05, label: "Hardwood Teak" },
    oak_parquet: { color: "#c2a078", roughness: 0.55, metalness: 0.02, label: "Natural Oak Parquet" },
    white_marble: { color: "#f8fafc", roughness: 0.15, metalness: 0.08, label: "Polished Carrara Marble" },
    kota_stone: { color: "#64748b", roughness: 0.7, metalness: 0.02, label: "Honed Kota Stone" },
    polished_concrete: { color: "#94a3b8", roughness: 0.35, metalness: 0.1, label: "Polished Concrete" },
  }[styling.floor_material]) || {
    color: "#e2e8f0",
    roughness: 0.7,
    metalness: 0.0,
    label: "Standard Floor",
  };

  // Color temperature to light color hex
  const kelvin = styling?.lighting?.temperature_k ?? 3000;
  const lightColor =
    kelvin < 2800
      ? "#ffe2ad"
      : kelvin < 3200
      ? "#fff1db"
      : kelvin < 4000
      ? "#fffaed"
      : kelvin < 5000
      ? "#ffffff"
      : "#eaf2ff";

  const ambientIntensity = styling?.lighting?.ambient_intensity ?? 0.65;
  const directionalIntensity = styling?.lighting?.directional_intensity ?? 1.25;

  const defaultWallColor = styling?.wall_color ?? "#FAF7F2";
  const accentWallColor = styling?.accent_wall_color ?? "#C2410C";
  const accentWallIndex = styling?.accent_wall_index ?? 0;

  const backWallColor = accentWallIndex === 0 && accentWallColor ? accentWallColor : defaultWallColor;
  const leftWallColor = accentWallIndex === 1 && accentWallColor ? accentWallColor : defaultWallColor;
  const rightWallColor = accentWallIndex === 2 && accentWallColor ? accentWallColor : defaultWallColor;

  // Camera preset handlers
  const setCameraPreset = (mode: "iso" | "top" | "eye") => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    if (mode === "iso") {
      controls.object.position.set(room.width_m * 0.9, room.height_m * 1.6, room.length_m * 1.3);
      controls.target.set(0, room.height_m * 0.3, 0);
    } else if (mode === "top") {
      controls.object.position.set(0, room.height_m * 2.8, 0.001);
      controls.target.set(0, 0, 0);
    } else if (mode === "eye") {
      controls.object.position.set(0, 1.4, room.length_m * 0.65);
      controls.target.set(0, 1.1, 0);
    }
    controls.update();
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* Top Overlay Bar: Info & Camera Presets */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-2">
          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
            3D Studio • Orbit: Drag • Pan: Right Click • Zoom: Scroll
          </div>
          {styling && (
            <div className="hidden sm:flex items-center space-x-2 bg-slate-900/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block border border-white/20"
                style={{ backgroundColor: accentWallColor || defaultWallColor }}
              />
              <span className="font-semibold text-slate-200">{styling.theme_name || "Interior Style"}</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-semibold">{kelvin}K</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">{floorConfig.label}</span>
            </div>
          )}
        </div>

        {/* Camera Preset Buttons */}
        <div className="flex space-x-1.5 bg-slate-900/80 backdrop-blur border border-slate-800 p-1 rounded-lg pointer-events-auto">
          <button
            onClick={() => setCameraPreset("iso")}
            className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Perspective Isometric View"
          >
            <Camera className="w-3.5 h-3.5 text-orange-500" />
            <span>Perspective</span>
          </button>
          <button
            onClick={() => setCameraPreset("top")}
            className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Top-Down Plan View"
          >
            <Layers className="w-3.5 h-3.5 text-orange-500" />
            <span>Top Plan</span>
          </button>
          <button
            onClick={() => setCameraPreset("eye")}
            className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Eye-Level Interior View"
          >
            <Eye className="w-3.5 h-3.5 text-orange-500" />
            <span>Eye Level</span>
          </button>
        </div>
      </div>

      <Canvas
        shadows
        camera={{
          position: [room.width_m * 0.9, room.height_m * 1.6, room.length_m * 1.3],
          fov: 45,
        }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            onSelectObject(null);
          }
        }}
      >
        <ambientLight intensity={ambientIntensity} color={lightColor} />
        <directionalLight
          position={[room.width_m, room.height_m * 2.5, room.length_m]}
          intensity={directionalIntensity}
          color={lightColor}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        <pointLight
          position={[0, room.height_m - 0.2, 0]}
          intensity={0.65}
          color={lightColor}
          distance={10}
        />

        <Suspense fallback={null}>
          {/* 1. Finished Floor Plane with Styling Texture/Material */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[room.width_m, room.length_m]} />
            <meshStandardMaterial
              color={floorConfig.color}
              roughness={floorConfig.roughness}
              metalness={floorConfig.metalness}
            />
          </mesh>

          {/* Metric Floor Grid */}
          <Grid
            position={[0, 0.002, 0]}
            args={[room.width_m, room.length_m]}
            cellSize={0.5}
            cellThickness={1}
            cellColor="#cbd5e1"
            sectionSize={1.0}
            sectionThickness={1.5}
            sectionColor="#94a3b8"
            fadeDistance={25}
          />

          {/* 2. Room Walls with Applied Color & Accent Wall */}
          {/* Back Wall (at -Z) */}
          <mesh
            position={[0, wallHeight / 2, -room.length_m / 2 - wallThickness / 2]}
            receiveShadow
          >
            <boxGeometry args={[room.width_m + wallThickness * 2, wallHeight, wallThickness]} />
            <meshStandardMaterial color={backWallColor} roughness={0.85} />
          </mesh>

          {/* Left Wall (at -X) */}
          <mesh
            position={[-room.width_m / 2 - wallThickness / 2, wallHeight / 2, 0]}
            receiveShadow
          >
            <boxGeometry args={[wallThickness, wallHeight, room.length_m]} />
            <meshStandardMaterial color={leftWallColor} roughness={0.85} />
          </mesh>

          {/* Right Wall (at +X) */}
          <mesh
            position={[room.width_m / 2 + wallThickness / 2, wallHeight / 2, 0]}
            receiveShadow
          >
            <boxGeometry args={[wallThickness, wallHeight, room.length_m]} />
            <meshStandardMaterial color={rightWallColor} roughness={0.85} />
          </mesh>

          {/* 3. Baseboard / Skirting Trim */}
          <mesh position={[0, 0.05, -room.length_m / 2 + 0.01]}>
            <boxGeometry args={[room.width_m, 0.1, 0.02]} />
            <meshStandardMaterial color="#cbd5e1" />
          </mesh>
          <mesh position={[-room.width_m / 2 + 0.01, 0.05, 0]}>
            <boxGeometry args={[0.02, 0.1, room.length_m]} />
            <meshStandardMaterial color="#cbd5e1" />
          </mesh>
          <mesh position={[room.width_m / 2 - 0.01, 0.05, 0]}>
            <boxGeometry args={[0.02, 0.1, room.length_m]} />
            <meshStandardMaterial color="#cbd5e1" />
          </mesh>

          {/* 4. Furniture Objects */}
          {objects.map((obj) => (
            <FurnitureMesh3D
              key={obj.instance_id}
              obj={obj}
              isSelected={selectedInstanceId === obj.instance_id}
              roomWidth={room.width_m}
              roomLength={room.length_m}
              onSelect={() => onSelectObject(obj.instance_id)}
            />
          ))}
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          makeDefault
          minDistance={1.5}
          maxDistance={35}
          maxPolarAngle={Math.PI / 2 - 0.02}
        />
      </Canvas>
    </div>
  );
};
