'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Mesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { ClosetComponent, UnitPart } from '@/lib/types/closet-editor';
import { useEditorDispatch, useEditorState } from './editor-context';
import { PART_COLORS } from '@/lib/data/system-presets';

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

/** Render internal parts (shelves and rods) as lines in plan view */
function InternalPartsPlanView({
  parts,
  unitWidth,
  unitDepth
}: {
  parts: UnitPart[];
  unitWidth: number; // scene units
  unitDepth: number; // scene units
}) {
  const lineWidth = unitWidth * 0.9;

  return (
    <group position={[0, 0, 0.002]}>
      {parts.map((part, idx) => {
        const normalizedY = part.y / 2400;
        const zPos = (unitDepth / 2) - (normalizedY * unitDepth * 0.8) - unitDepth * 0.1;
        const color = part.type === 'rod' ? PART_COLORS.rod : PART_COLORS.shelf;
        const thickness = part.type === 'rod' ? 0.03 : 0.02;

        return (
          <mesh key={part.id || idx} position={[0, zPos, 0]}>
            <planeGeometry args={[lineWidth, thickness]} />
            <meshBasicMaterial color={color} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Draggable part mesh for elevation/3D view */
function DraggablePart({
  part,
  componentId,
  unitWidth,
  unitHeight,
  is3D = false,
  unitDepth = 6,
}: {
  part: UnitPart;
  componentId: string;
  unitWidth: number;
  unitHeight: number;
  is3D?: boolean;
  unitDepth?: number;
}) {
  const dispatch = useEditorDispatch();
  const { camera, gl } = useThree();
  const meshRef = useRef<Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragStartY = useRef(0);
  const partStartY = useRef(0);

  const yPos = (part.y / 100) - (unitHeight / 2);
  const color = part.type === 'rod' ? PART_COLORS.rod : PART_COLORS.shelf;
  const lineWidth = unitWidth * 0.85;
  const thickness = part.type === 'rod' ? 0.08 : 0.05;

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    partStartY.current = part.y;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    gl.domElement.style.cursor = 'grabbing';
  }, [part.y, gl]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    e.stopPropagation();

    // Calculate delta in screen space and convert to mm
    const deltaY = dragStartY.current - e.clientY;
    const sensitivity = 5; // mm per pixel
    let newY = partStartY.current + (deltaY * sensitivity);

    // Clamp to valid range
    newY = Math.max(50, Math.min(2350, newY));
    // Snap to 50mm increments
    newY = Math.round(newY / 50) * 50;

    dispatch({
      type: 'UPDATE_PART',
      payload: { componentId, partId: part.id, changes: { y: newY } },
    });
  }, [isDragging, componentId, part.id, dispatch]);

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    e.stopPropagation();
    setIsDragging(false);
    gl.domElement.style.cursor = 'auto';
  }, [isDragging, gl]);

  if (is3D && part.type === 'rod') {
    // 3D view: render rod as cylinder
    return (
      <mesh
        ref={meshRef}
        position={[0, yPos, 0]}
        rotation={[0, 0, Math.PI / 2]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerOver={() => { setIsHovered(true); gl.domElement.style.cursor = 'grab'; }}
        onPointerOut={() => { setIsHovered(false); if (!isDragging) gl.domElement.style.cursor = 'auto'; }}
      >
        <cylinderGeometry args={[0.08, 0.08, lineWidth, 16]} />
        <meshStandardMaterial
          color={isHovered || isDragging ? '#60A5FA' : color}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
    );
  }

  return (
    <mesh
      ref={meshRef}
      position={[0, yPos, is3D ? 0 : 0.1]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerOver={() => { setIsHovered(true); gl.domElement.style.cursor = 'grab'; }}
      onPointerOut={() => { setIsHovered(false); if (!isDragging) gl.domElement.style.cursor = 'auto'; }}
    >
      <boxGeometry args={[lineWidth, thickness, is3D ? unitDepth * 0.8 : 0.02]} />
      <meshStandardMaterial color={isHovered || isDragging ? '#60A5FA' : color} />
    </mesh>
  );
}

/** Render internal parts for elevation view (front view showing width × height) */
function InternalPartsElevationView({
  parts,
  componentId,
  unitWidth,
  unitHeight,
}: {
  parts: UnitPart[];
  componentId: string;
  unitWidth: number;
  unitHeight: number;
}) {
  return (
    <group>
      {parts.map((part) => (
        <DraggablePart
          key={part.id}
          part={part}
          componentId={componentId}
          unitWidth={unitWidth}
          unitHeight={unitHeight}
        />
      ))}
    </group>
  );
}

/** Resize handle for adjusting unit width */
function ResizeHandle({
  position,
  side,
  componentId,
  currentWidth,
}: {
  position: [number, number, number];
  side: 'left' | 'right';
  componentId: string;
  currentWidth: number;
}) {
  const dispatch = useEditorDispatch();
  const { gl } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(true);
    startX.current = e.clientX;
    startWidth.current = currentWidth;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    gl.domElement.style.cursor = 'ew-resize';
  }, [currentWidth, gl]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    e.stopPropagation();

    const deltaX = e.clientX - startX.current;
    const sensitivity = 2; // mm per pixel
    let deltaWidth = deltaX * sensitivity;

    if (side === 'left') {
      deltaWidth = -deltaWidth;
    }

    let newWidth = startWidth.current + deltaWidth;
    // Snap to 50mm increments, min 200mm, max 2000mm
    newWidth = Math.max(200, Math.min(2000, Math.round(newWidth / 50) * 50));

    dispatch({
      type: 'UPDATE_COMPONENT',
      payload: {
        id: componentId,
        changes: { dimensions: { width: newWidth, height: 2400, depth: 600 } },
      },
    });
  }, [isDragging, side, componentId, dispatch]);

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    e.stopPropagation();
    setIsDragging(false);
    gl.domElement.style.cursor = 'auto';
  }, [isDragging, gl]);

  return (
    <mesh
      position={position}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerOver={() => { setIsHovered(true); gl.domElement.style.cursor = 'ew-resize'; }}
      onPointerOut={() => { setIsHovered(false); if (!isDragging) gl.domElement.style.cursor = 'auto'; }}
    >
      <boxGeometry args={[0.15, 0.6, 0.01]} />
      <meshBasicMaterial
        color={isDragging ? '#2563eb' : isHovered ? '#60A5FA' : '#93C5FD'}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

/** Render internal parts for 3D view */
function InternalParts3DView({
  parts,
  componentId,
  unitWidth,
  unitHeight,
  unitDepth,
}: {
  parts: UnitPart[];
  componentId: string;
  unitWidth: number;
  unitHeight: number;
  unitDepth: number;
}) {
  return (
    <group>
      {parts.map((part) => (
        <DraggablePart
          key={part.id}
          part={part}
          componentId={componentId}
          unitWidth={unitWidth}
          unitHeight={unitHeight}
          unitDepth={unitDepth}
          is3D
        />
      ))}
    </group>
  );
}

export function ClosetComponentMesh({ component }: ClosetComponentMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const { viewMode, selectedId, snapEnabled, gridSize, components } = useEditorState();
  const dispatch = useEditorDispatch();
  const { camera, gl } = useThree();

  const isSelected = selectedId === component.id;

  // Convert mm dimensions to scene units (1 unit = 100mm)
  const w = component.dimensions.width / 100;
  const h = component.dimensions.height / 100;
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
        // Grid snap
        newX = snapToGrid(newX, gridSize);
        newZ = snapToGrid(newZ, gridSize);

        // Unit-to-unit snap (magnet)
        const SNAP_THRESHOLD = 0.5; // scene units (50mm)
        const otherComponents = components.filter((c) => c.id !== component.id && !c.locked);

        for (const other of otherComponents) {
          const otherW = other.dimensions.width / 100;
          const otherD = other.dimensions.depth / 100;
          const otherX = other.position[0];
          const otherZ = other.position[2];

          // Left edge of dragged -> Right edge of other
          const myLeft = newX - w / 2;
          const otherRight = otherX + otherW / 2;
          if (Math.abs(myLeft - otherRight) < SNAP_THRESHOLD) {
            newX = otherRight + w / 2;
          }

          // Right edge of dragged -> Left edge of other
          const myRight = newX + w / 2;
          const otherLeft = otherX - otherW / 2;
          if (Math.abs(myRight - otherLeft) < SNAP_THRESHOLD) {
            newX = otherLeft - w / 2;
          }

          // Top edge of dragged -> Bottom edge of other (Z axis)
          const myTop = newZ - d / 2;
          const otherBottom = otherZ + otherD / 2;
          if (Math.abs(myTop - otherBottom) < SNAP_THRESHOLD) {
            newZ = otherBottom + d / 2;
          }

          // Bottom edge of dragged -> Top edge of other
          const myBottom = newZ + d / 2;
          const otherTop = otherZ - otherD / 2;
          if (Math.abs(myBottom - otherTop) < SNAP_THRESHOLD) {
            newZ = otherTop - d / 2;
          }

          // Align centers (X axis)
          if (Math.abs(newX - otherX) < SNAP_THRESHOLD) {
            newX = otherX;
          }

          // Align centers (Z axis)
          if (Math.abs(newZ - otherZ) < SNAP_THRESHOLD) {
            newZ = otherZ;
          }
        }
      }

      dispatch({
        type: 'UPDATE_COMPONENT',
        payload: {
          id: component.id,
          changes: { position: [newX, 0, newZ] },
        },
      });
    },
    [isDragging, component.id, components, w, d, snapEnabled, gridSize, dispatch, toNDC, raycastToPlane],
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

  // Material properties based on type
  const getMaterialProps = () => {
    const material = component.material || 'melamine';
    switch (material) {
      case 'melamine':
        return { roughness: 0.3, metalness: 0, transparent: false, opacity: 1 };
      case 'mdf':
        return { roughness: 0.5, metalness: 0, transparent: false, opacity: 1 };
      case 'wood':
        return { roughness: 0.7, metalness: 0, transparent: false, opacity: 1 };
      case 'glass':
        return { roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.5 };
      default:
        return { roughness: 0.3, metalness: 0, transparent: false, opacity: 1 };
    }
  };

  const materialProps = getMaterialProps();

  // 3D/Elevation view: render as 3D box
  if (viewMode === '3d' || viewMode === 'elevation') {
    return (
      <group position={[component.position[0], h / 2, component.position[2]]}>
        {/* Main 3D box */}
        <mesh
          ref={meshRef}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial
            color={component.color}
            roughness={materialProps.roughness}
            metalness={materialProps.metalness}
            transparent={materialProps.transparent || opacity < 1 || isSelected}
            opacity={
              materialProps.transparent
                ? materialProps.opacity * (isSelected ? 0.7 : 0.9)
                : isSelected
                ? Math.min(opacity, 0.7)
                : opacity * 0.9
            }
          />
        </mesh>

        {/* Border edges */}
        {component.borderColor && (
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
            <lineBasicMaterial color={component.borderColor} />
          </lineSegments>
        )}

        {/* Selection outline */}
        {isSelected && (
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(w + 0.05, h + 0.05, d + 0.05)]} />
            <lineBasicMaterial color="#2563eb" linewidth={2} />
          </lineSegments>
        )}

        {/* Internal parts for 3D/Elevation */}
        {component.parts && component.parts.length > 0 && (
          viewMode === '3d' ? (
            <InternalParts3DView
              parts={component.parts}
              componentId={component.id}
              unitWidth={w}
              unitHeight={h}
              unitDepth={d}
            />
          ) : (
            <InternalPartsElevationView
              parts={component.parts}
              componentId={component.id}
              unitWidth={w}
              unitHeight={h}
            />
          )
        )}

        {/* Label */}
        {component.label && (
          <Html center position={[0, h / 2 + 0.3, 0]} distanceFactor={15}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#374151',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                userSelect: 'none',
                background: 'rgba(255,255,255,0.8)',
                padding: '2px 6px',
                borderRadius: '3px',
              }}
            >
              {component.label}
            </div>
          </Html>
        )}
      </group>
    );
  }

  // Plan view: render as 2D shape (top-down)
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

      {/* Resize handles (only when selected and not locked) */}
      {isSelected && !component.locked && component.presetType && (
        <>
          <ResizeHandle
            position={[-w / 2, 0, 0.01]}
            side="left"
            componentId={component.id}
            currentWidth={component.dimensions.width}
          />
          <ResizeHandle
            position={[w / 2, 0, 0.01]}
            side="right"
            componentId={component.id}
            currentWidth={component.dimensions.width}
          />
        </>
      )}

      {/* Internal parts (shelves, rods) for closet units - Plan View */}
      {viewMode === 'plan' && component.parts && component.parts.length > 0 && (
        <InternalPartsPlanView
          parts={component.parts}
          unitWidth={w}
          unitDepth={d}
        />
      )}

      {/* Label */}
      {component.label && (
        <Html center distanceFactor={15} zIndexRange={[5, 0]}>
          <div
            style={{
              fontSize: '10px',
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
