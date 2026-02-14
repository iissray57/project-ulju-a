'use client';

import { useRef, useState, useCallback } from 'react';
import { Edges } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Mesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { ClosetComponent } from '@/lib/types/closet-editor';
import { useEditorDispatch, useEditorState } from './editor-context';

interface ClosetComponentMeshProps {
  component: ClosetComponent;
}

/** Snap a value to the nearest grid increment. */
function snapToGrid(value: number, gridSizeMm: number): number {
  const unit = gridSizeMm / 100; // mm -> scene units
  return Math.round(value / unit) * unit;
}

export function ClosetComponentMesh({ component }: ClosetComponentMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const { selectedId, snapEnabled, gridSize } = useEditorState();
  const dispatch = useEditorDispatch();
  const { camera, gl } = useThree();

  const isSelected = selectedId === component.id;

  // Convert mm dimensions to scene units (1 unit = 100mm)
  const w = component.dimensions.width / 100;
  const h = component.dimensions.height / 100;
  const d = component.dimensions.depth / 100;

  // Drag state refs (avoid re-renders during drag)
  const [isDragging, setIsDragging] = useState(false);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragOffset = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());

  /** Convert client coords to NDC. */
  const toNDC = useCallback(
    (clientX: number, clientY: number): THREE.Vector2 => {
      const rect = gl.domElement.getBoundingClientRect();
      return new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
    },
    [gl],
  );

  /** Raycast from NDC coords onto the drag plane. */
  const raycastToPlane = useCallback(
    (ndc: THREE.Vector2): THREE.Vector3 | null => {
      raycaster.current.setFromCamera(ndc, camera);
      const target = new THREE.Vector3();
      const hit = raycaster.current.ray.intersectPlane(dragPlane.current, target);
      return hit;
    },
    [camera],
  );

  // ── Pointer Handlers ────────────────────────────────────

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (component.locked) return;
      e.stopPropagation();

      // Select on pointer down
      dispatch({ type: 'SELECT_COMPONENT', payload: component.id });

      // Set drag plane at the component's Y position
      dragPlane.current.set(new THREE.Vector3(0, 1, 0), -component.position[1]);

      // Calculate offset between intersection point and component position
      const ndc = toNDC(e.clientX, e.clientY);
      const hit = raycastToPlane(ndc);
      if (!hit) return;

      dragOffset.current.set(
        hit.x - component.position[0],
        0,
        hit.z - component.position[2],
      );

      setIsDragging(true);
      dispatch({ type: 'SET_DRAGGING', payload: true });

      // Capture pointer so we get move/up events even outside the mesh
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      gl.domElement.style.cursor = 'grabbing';
    },
    [component.locked, component.id, component.position, dispatch, gl, toNDC, raycastToPlane],
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDragging) return;
      e.stopPropagation();

      const ndc = toNDC(e.clientX, e.clientY);
      const hit = raycastToPlane(ndc);
      if (!hit) return;

      let newX = hit.x - dragOffset.current.x;
      let newZ = hit.z - dragOffset.current.z;

      if (snapEnabled) {
        newX = snapToGrid(newX, gridSize);
        newZ = snapToGrid(newZ, gridSize);
      }

      dispatch({
        type: 'UPDATE_COMPONENT',
        payload: {
          id: component.id,
          changes: {
            position: [newX, component.position[1], newZ],
          },
        },
      });
    },
    [isDragging, component.id, component.position, snapEnabled, gridSize, dispatch, toNDC, raycastToPlane],
  );

  const handlePointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDragging) return;
      e.stopPropagation();

      setIsDragging(false);
      dispatch({ type: 'SET_DRAGGING', payload: false });
      gl.domElement.style.cursor = 'auto';
    },
    [isDragging, dispatch, gl],
  );

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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
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
