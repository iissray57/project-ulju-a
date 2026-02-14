'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { useTheme } from 'next-themes';
import { useEditorState, useEditorDispatch } from './editor-context';
import { ClosetComponentMesh } from './closet-component-mesh';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

function Scene() {
  const { components, cameraMode, gridSize, cameraResetCounter } = useEditorState();
  const dispatch = useEditorDispatch();
  const { resolvedTheme } = useTheme();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const isDark = resolvedTheme === 'dark';

  // Grid cell size in scene units (gridSize mm -> scene units at 1:100)
  const cellSize = gridSize / 100;
  const sectionSize = cellSize * 10;

  // Camera reset: reset controls target and camera position
  useEffect(() => {
    if (cameraResetCounter > 0 && controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [cameraResetCounter]);

  const handlePointerMissed = useCallback(() => {
    dispatch({ type: 'SELECT_COMPONENT', payload: null });
  }, [dispatch]);

  return (
    <>
      {/* Cameras */}
      {cameraMode === '2d' ? (
        <OrthographicCamera
          makeDefault
          position={[0, 10, 0]}
          zoom={80}
          near={0.1}
          far={100}
          key={`ortho-${cameraResetCounter}`}
        />
      ) : (
        <PerspectiveCamera
          makeDefault
          position={[8, 6, 8]}
          fov={50}
          near={0.1}
          far={200}
          key={`persp-${cameraResetCounter}`}
        />
      )}

      {/* Controls */}
      <OrbitControls
        ref={controlsRef}
        enableRotate={cameraMode === '3d'}
        enablePan
        enableZoom
        // 2D mode: top-down view locked
        maxPolarAngle={cameraMode === '2d' ? 0 : Math.PI / 2.1}
        minPolarAngle={cameraMode === '2d' ? 0 : 0}
        // 2D mode: zoom limits
        minZoom={cameraMode === '2d' ? 20 : undefined}
        maxZoom={cameraMode === '2d' ? 200 : undefined}
        // 3D mode: distance limits
        minDistance={cameraMode === '3d' ? 2 : undefined}
        maxDistance={cameraMode === '3d' ? 50 : undefined}
      />

      {/* Lighting */}
      <ambientLight intensity={isDark ? 0.4 : 0.6} />
      <directionalLight position={[5, 10, 5]} intensity={isDark ? 0.6 : 0.8} />
      <directionalLight position={[-3, 8, -3]} intensity={0.3} />

      {/* Grid */}
      <Grid
        args={[30, 30]}
        cellSize={cellSize}
        sectionSize={sectionSize}
        cellColor={isDark ? '#444444' : '#cccccc'}
        sectionColor={isDark ? '#666666' : '#999999'}
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid
        position={[0, 0, 0]}
      />

      {/* Components */}
      <group onPointerMissed={handlePointerMissed}>
        {components.map((comp) => (
          <ClosetComponentMesh key={comp.id} component={comp} />
        ))}
      </group>
    </>
  );
}

export function ClosetCanvas() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="h-full w-full">
      <Canvas
        gl={{ antialias: true, alpha: false }}
        style={{ background: isDark ? '#1a1a1a' : '#f5f5f5' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
