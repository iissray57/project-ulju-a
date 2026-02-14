'use client';

import { useRef } from 'react';
import { Edges } from '@react-three/drei';
import type { Mesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { ClosetComponent } from '@/lib/types/closet-editor';
import { useEditorDispatch, useEditorState } from './editor-context';

interface ClosetComponentMeshProps {
  component: ClosetComponent;
}

export function ClosetComponentMesh({ component }: ClosetComponentMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const { selectedId } = useEditorState();
  const dispatch = useEditorDispatch();

  const isSelected = selectedId === component.id;

  // Convert mm dimensions to scene units (1 unit = 100mm for reasonable scale)
  const w = component.dimensions.width / 100;
  const h = component.dimensions.height / 100;
  const d = component.dimensions.depth / 100;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    dispatch({ type: 'SELECT_COMPONENT', payload: component.id });
  };

  return (
    <mesh
      ref={meshRef}
      position={component.position}
      rotation={component.rotation}
      scale={component.scale}
      onClick={handleClick}
    >
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial
        color={component.color}
        transparent={isSelected}
        opacity={isSelected ? 0.85 : 1}
      />
      {isSelected && (
        <Edges linewidth={2} color="#2563eb" />
      )}
    </mesh>
  );
}
