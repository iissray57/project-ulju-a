'use client';

import { Suspense, useRef, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { Mesh, Group, Vector3 } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useRackSim } from '../rack-context';
import { RackMesh } from './rack-mesh';
import { BackgroundScene } from './background-scene';

// ---------------------------------------------------------------------------
// Scene content (rendered inside Canvas)
// ---------------------------------------------------------------------------
function SceneContent() {
  const { state, dispatch } = useRackSim();
  const { items, selectedItemId, cameraMode, background } = state;

  // Orbit controls ref so we can disable during drag
  const orbitRef = useRef<OrbitControlsImpl>(null);

  // Invisible floor plane ref for raycasting
  const floorRef = useRef<Mesh>(null);

  // Drag state (refs for zero-rerender during drag)
  const dragRef = useRef<{ itemId: string; offsetX: number; offsetZ: number } | null>(null);

  // Per-rack group refs for live position update during drag
  const groupRefs = useRef<Map<string, React.RefObject<Group | null>>>(new Map());

  // Ensure we have a ref for every item
  items.forEach((item) => {
    if (!groupRefs.current.has(item.id)) {
      groupRefs.current.set(item.id, { current: null });
    }
  });
  // Clean up stale refs
  const currentIds = new Set(items.map((i) => i.id));
  groupRefs.current.forEach((_, id) => {
    if (!currentIds.has(id)) groupRefs.current.delete(id);
  });

  const handleDragStart = useCallback(
    (itemId: string) => (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();

      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      // Raycast against the floor to get world point
      const intersections = e.intersections;
      // Find floor intersection (or fall back to e.point)
      let floorPoint: Vector3 = e.point.clone();
      if (floorRef.current) {
        const floorHit = intersections.find((hit) => hit.object === floorRef.current);
        if (floorHit) floorPoint = floorHit.point.clone();
      }

      dragRef.current = {
        itemId,
        offsetX: floorPoint.x - item.position.x,
        offsetZ: floorPoint.z - item.position.z,
      };

      // Disable orbit so camera doesn't move during drag
      if (orbitRef.current) orbitRef.current.enabled = false;
    },
    [items],
  );

  const handleFloorPointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!dragRef.current) return;
    e.stopPropagation();

    const point = e.point;
    const newX = point.x - dragRef.current.offsetX;
    const newZ = point.z - dragRef.current.offsetZ;

    // Update Three.js group position directly (no state dispatch = no rerender)
    const ref = groupRefs.current.get(dragRef.current.itemId);
    if (ref?.current) {
      // The group has an internal cx/cz offset baked in via position prop on the inner group.
      // The outer wrapper group (from rack-scene) controls world XZ position.
      ref.current.position.x = newX;
      ref.current.position.z = newZ;
    }
  }, []);

  const handleFloorPointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!dragRef.current) return;

      const point = e.point;
      const newX = point.x - dragRef.current.offsetX;
      const newZ = point.z - dragRef.current.offsetZ;

      dispatch({
        type: 'UPDATE_POSITION',
        payload: { id: dragRef.current.itemId, x: newX, z: newZ },
      });

      dragRef.current = null;

      // Re-enable orbit
      if (orbitRef.current) orbitRef.current.enabled = true;
    },
    [dispatch],
  );

  // Also handle pointer-up on canvas level in case mouse leaves floor
  const handleMissedPointerUp = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (orbitRef.current) orbitRef.current.enabled = true;
  }, []);

  return (
    <>
      {/* ---- Lighting ---- */}
      <ambientLight intensity={0.75} color="#FFFFFF" />

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

      <directionalLight
        position={[3, 3, -3]}
        intensity={0.9}
        color="#E8F0FF"
      />

      <pointLight position={[0, -0.5, -2]} intensity={0.5} color="#FFFFFF" />

      {/* ---- Environment (HDRI-like reflections on metal) ---- */}
      <Environment preset="warehouse" />

      {/* ---- Background ---- */}
      <BackgroundScene background={background} rackCount={items.length} />

      {/* ---- Invisible floor plane for drag raycasting ---- */}
      <mesh
        ref={floorRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, 0]}
        onPointerMove={handleFloorPointerMove}
        onPointerUp={handleFloorPointerUp}
        onPointerLeave={handleMissedPointerUp}
      >
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* ---- Racks ---- */}
      {items.map((item) => {
        const ref = groupRefs.current.get(item.id)!;
        return (
          <group
            key={item.id}
            ref={ref as React.RefObject<Group>}
            position={[item.position.x, 0, item.position.z]}
          >
            <RackMesh
              item={item}
              isSelected={item.id === selectedItemId}
              onClick={() =>
                dispatch({
                  type: 'SELECT_ITEM',
                  payload: item.id === selectedItemId ? null : item.id,
                })
              }
              onDragStart={handleDragStart(item.id)}
            />
          </group>
        );
      })}

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
        ref={orbitRef}
        enableRotate={cameraMode === 'free'}
        enableZoom
        enablePan={cameraMode === 'free'}
        minDistance={0.5}
        maxDistance={12}
        target={[0, 0.9, 0]}
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
