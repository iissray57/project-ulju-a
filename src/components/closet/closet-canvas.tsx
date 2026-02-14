'use client';

import { useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { useTheme } from 'next-themes';
import { useEditorState, useEditorDispatch } from './editor-context';
import { ClosetComponentMesh } from './closet-component-mesh';

function Scene() {
  const { components, cameraMode, gridSize } = useEditorState();
  const dispatch = useEditorDispatch();
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  // Grid cell size in scene units (gridSize mm -> scene units at 1:100)
  const cellSize = gridSize / 100;
  const sectionSize = cellSize * 10;

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
        />
      ) : (
        <PerspectiveCamera
          makeDefault
          position={[8, 6, 8]}
          fov={50}
          near={0.1}
          far={200}
        />
      )}

      {/* Controls */}
      <OrbitControls
        enableRotate={cameraMode === '3d'}
        enablePan
        enableZoom
        maxPolarAngle={cameraMode === '2d' ? 0 : Math.PI / 2}
        minPolarAngle={cameraMode === '2d' ? 0 : 0}
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
