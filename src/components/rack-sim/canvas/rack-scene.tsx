'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { useRackSim } from '../rack-context';
import { RackMesh } from './rack-mesh';
import { BackgroundScene } from './background-scene';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MM = 0.001;
const RACK_GAP = 200 * MM;   // 200mm gap between racks in Three.js units

// ---------------------------------------------------------------------------
// Scene content (rendered inside Canvas)
// ---------------------------------------------------------------------------
function SceneContent() {
  const { state, dispatch } = useRackSim();
  const { items, selectedItemId, cameraMode, background } = state;

  // Layout: racks side by side along X axis, centered at origin
  const rackPositions = useMemo(() => {
    if (items.length === 0) return [];

    // Compute total width occupied by all racks + gaps
    const totalWidth = items.reduce((sum, item) => sum + item.width * MM, 0)
      + RACK_GAP * (items.length - 1);

    let cursor = -totalWidth / 2;
    return items.map((item) => {
      const pos = cursor + (item.width * MM) / 2;
      cursor += item.width * MM + RACK_GAP;
      return pos;
    });
  }, [items]);

  return (
    <>
      {/* ---- Lighting ---- */}
      {/* Soft ambient – brighter for dark background contrast */}
      <ambientLight intensity={0.75} color="#FFFFFF" />

      {/* Key light – upper front left */}
      <directionalLight
        position={[-3, 5, 4]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        color="#FFF8F0"
      />

      {/* Fill light – upper back right */}
      <directionalLight
        position={[3, 3, -3]}
        intensity={0.9}
        color="#E8F0FF"
      />

      {/* Rim light – from below-back for metal sheen */}
      <pointLight position={[0, -0.5, -2]} intensity={0.5} color="#FFFFFF" />

      {/* ---- Environment (HDRI-like reflections on metal) ---- */}
      <Environment preset="warehouse" />

      {/* ---- Background ---- */}
      <BackgroundScene background={background} rackCount={items.length} />

      {/* ---- Racks ---- */}
      {items.map((item, index) => (
        <group key={item.id} position={[rackPositions[index], 0, 0]}>
          <RackMesh
            item={item}
            isSelected={item.id === selectedItemId}
            onClick={() =>
              dispatch({
                type: 'SELECT_ITEM',
                payload: item.id === selectedItemId ? null : item.id,
              })
            }
          />
        </group>
      ))}

      {/* ---- Camera ---- */}
      <PerspectiveCamera
        makeDefault
        position={[0, 1.6, 3.5]}
        fov={40}
        near={0.01}
        far={50}
      />

      {/* ---- Controls ---- */}
      <OrbitControls
        enableRotate={cameraMode === 'free'}
        enableZoom
        enablePan={cameraMode === 'free'}
        minDistance={0.5}
        maxDistance={12}
        target={[0, 0.9, 0]}
        // In fixed mode lock to a nice preset angle
        minPolarAngle={cameraMode === 'fixed' ? Math.PI / 4 : 0}
        maxPolarAngle={cameraMode === 'fixed' ? Math.PI / 4 : Math.PI / 2}
        minAzimuthAngle={cameraMode === 'fixed' ? -Math.PI / 8 : -Infinity}
        maxAzimuthAngle={cameraMode === 'fixed' ? Math.PI / 8 : Infinity}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Empty scene hint
// ---------------------------------------------------------------------------
function EmptyHint() {
  return (
    <mesh position={[0, 0.8, 0]}>
      <boxGeometry args={[0.001, 0.001, 0.001]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export function RackScene() {
  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100%', height: '100%', background: '#1A1A1A' }}
    >
      <Suspense fallback={<EmptyHint />}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}
