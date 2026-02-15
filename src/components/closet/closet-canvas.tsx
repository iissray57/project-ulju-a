'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls, OrthographicCamera } from '@react-three/drei';
import { useTheme } from 'next-themes';
import { useEditorState, useEditorDispatch } from './editor-context';
import { ClosetComponentMesh } from './closet-component-mesh';
import { DimensionLabel } from './dimension-label';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

function Scene() {
  const {
    components,
    gridSize,
    cameraResetCounter,
    isDragging,
    showDimensions,
    showGrid,
    selectedId,
    zoom,
  } = useEditorState();
  const dispatch = useEditorDispatch();
  const { resolvedTheme } = useTheme();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const isDark = resolvedTheme === 'dark';

  // Grid cell size in scene units (gridSize mm -> scene units at 1:100)
  const cellSize = gridSize / 100;
  const sectionSize = cellSize * 10;

  // Disable OrbitControls while a component is being dragged
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = !isDragging;
    }
  }, [isDragging]);

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

  // Find the selected component for dimension labels
  const selectedComponent = selectedId
    ? components.find((c) => c.id === selectedId)
    : null;

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[0, 10, 0]}
        zoom={zoom}
        near={0.1}
        far={100}
        key={`ortho-${cameraResetCounter}`}
      />

      <OrbitControls
        ref={controlsRef}
        enableRotate={false}
        enablePan
        enableZoom
        maxPolarAngle={0}
        minPolarAngle={0}
        minZoom={20}
        maxZoom={300}
      />

      {/* Lighting */}
      <ambientLight intensity={isDark ? 0.4 : 0.6} />
      <directionalLight position={[5, 10, 5]} intensity={isDark ? 0.6 : 0.8} />
      <directionalLight position={[-3, 8, -3]} intensity={0.3} />

      {/* Grid */}
      {showGrid && (
        <Grid
          args={[50, 50]}
          cellSize={cellSize}
          sectionSize={sectionSize}
          cellColor={isDark ? '#444444' : '#cccccc'}
          sectionColor={isDark ? '#666666' : '#999999'}
          fadeDistance={40}
          fadeStrength={1}
          infiniteGrid
          position={[0, -0.01, 0]}
        />
      )}

      {/* Components */}
      <group onPointerMissed={handlePointerMissed}>
        {components.map((comp) => (
          <ClosetComponentMesh key={comp.id} component={comp} />
        ))}
      </group>

      {/* Dimension labels for the selected component */}
      {showDimensions && selectedComponent && (
        <DimensionLabel component={selectedComponent} />
      )}
    </>
  );
}

export function ClosetCanvas() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="h-full w-full">
      <Canvas
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
        style={{ background: isDark ? '#1a1a1a' : '#f5f5f5' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
