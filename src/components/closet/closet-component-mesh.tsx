'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { Html } from '@react-three/drei';
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
  const unit = gridSizeMm / 100;
  return Math.round(value / unit) * unit;
}

/** Create a rounded rectangle shape for Three.js */
function createRoundedRectShape(w: number, d: number, radius: number): THREE.Shape {
  const r = Math.min(radius, w / 2, d / 2);
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + r, -d / 2);
  shape.lineTo(w / 2 - r, -d / 2);
  shape.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  shape.lineTo(w / 2, d / 2 - r);
  shape.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  shape.lineTo(-w / 2 + r, d / 2);
  shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  shape.lineTo(-w / 2, -d / 2 + r);
  shape.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  return shape;
}

/** Create a circle shape */
function createCircleShape(radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
  return shape;
}

export function ClosetComponentMesh({ component }: ClosetComponentMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const { selectedId, snapEnabled, gridSize } = useEditorState();
  const dispatch = useEditorDispatch();
  const { camera, gl } = useThree();

  const isSelected = selectedId === component.id;

  // Convert mm dimensions to scene units (1 unit = 100mm)
  const w = component.dimensions.width / 100;
  const d = component.dimensions.depth / 100;
  const borderRadius = (component.borderRadius || 0) / 100;

  // Create geometry based on shape type
  const shapeGeometry = useMemo(() => {
    let shape: THREE.Shape;

    switch (component.shapeType) {
      case 'rounded-rect':
        shape = createRoundedRectShape(w, d, borderRadius || 0.1);
        break;
      case 'circle': {
        const radius = Math.min(w, d) / 2;
        shape = createCircleShape(radius);
        break;
      }
      case 'rect':
      default:
        shape = new THREE.Shape();
        shape.moveTo(-w / 2, -d / 2);
        shape.lineTo(w / 2, -d / 2);
        shape.lineTo(w / 2, d / 2);
        shape.lineTo(-w / 2, d / 2);
        shape.lineTo(-w / 2, -d / 2);
        break;
    }

    return new THREE.ShapeGeometry(shape);
  }, [component.shapeType, w, d, borderRadius]);

  // Selection outline
  const outlineGeometry = useMemo(() => {
    if (!isSelected) return null;
    const padding = 0.02;
    const ow = w + padding * 2;
    const od = d + padding * 2;
    const shape = component.shapeType === 'rounded-rect'
      ? createRoundedRectShape(ow, od, (borderRadius || 0.1) + padding)
      : component.shapeType === 'circle'
        ? createCircleShape(Math.min(ow, od) / 2)
        : (() => {
            const s = new THREE.Shape();
            s.moveTo(-ow / 2, -od / 2);
            s.lineTo(ow / 2, -od / 2);
            s.lineTo(ow / 2, od / 2);
            s.lineTo(-ow / 2, od / 2);
            s.lineTo(-ow / 2, -od / 2);
            return s;
          })();
    return new THREE.ShapeGeometry(shape);
  }, [isSelected, w, d, borderRadius, component.shapeType]);

  // Drag state refs
  const [isDragging, setIsDragging] = useState(false);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragOffset = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());

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

  const raycastToPlane = useCallback(
    (ndc: THREE.Vector2): THREE.Vector3 | null => {
      raycaster.current.setFromCamera(ndc, camera);
      const target = new THREE.Vector3();
      return raycaster.current.ray.intersectPlane(dragPlane.current, target);
    },
    [camera],
  );

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (component.locked || e.button !== 0) return;
      e.stopPropagation();

      dispatch({ type: 'SELECT_COMPONENT', payload: component.id });

      dragPlane.current.set(new THREE.Vector3(0, 1, 0), 0);

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
          changes: { position: [newX, 0, newZ] },
        },
      });
    },
    [isDragging, component.id, snapEnabled, gridSize, dispatch, toNDC, raycastToPlane],
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

  const opacity = component.opacity ?? 1;

  return (
    <group
      position={[component.position[0], 0.01, component.position[2]]}
      rotation={[-Math.PI / 2, 0, component.rotation[1]]}
    >
      {/* Selection outline (behind) */}
      {isSelected && outlineGeometry && (
        <mesh position={[0, 0, -0.001]} geometry={outlineGeometry}>
          <meshBasicMaterial color="#2563eb" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Main shape */}
      <mesh
        ref={meshRef}
        geometry={shapeGeometry}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <meshBasicMaterial
          color={component.color}
          transparent={opacity < 1 || isSelected}
          opacity={isSelected ? Math.min(opacity, 0.9) : opacity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Border */}
      {component.borderColor && (
        <lineLoop>
          <bufferGeometry attach="geometry">
            <bufferAttribute
              attach="attributes-position"
              args={[shapeGeometry.attributes.position.array, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={component.borderColor} linewidth={1} />
        </lineLoop>
      )}

      {/* Label */}
      {component.label && (
        <Html center distanceFactor={6} zIndexRange={[5, 0]}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: '#374151',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              userSelect: 'none',
              textShadow: '0 0 3px rgba(255,255,255,0.8)',
            }}
          >
            {component.label}
          </div>
        </Html>
      )}
    </group>
  );
}
