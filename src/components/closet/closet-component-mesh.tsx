'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Mesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { ClosetComponent, UnitPart, CornerType } from '@/lib/types/closet-editor';
import { FRAME_COLOR_OPTIONS, SHELF_COLOR_OPTIONS } from '@/lib/types/closet-editor';
import { useEditorDispatch, useEditorState } from './editor-context';
import { PILLAR_WIDTH } from '@/lib/data/system-presets';

interface ClosetComponentMeshProps {
  component: ClosetComponent;
}

// ── 색상 헬퍼 ──────────────────────────────────────────

function getFrameHex(comp: ClosetComponent): string {
  if (comp.frameColor && FRAME_COLOR_OPTIONS[comp.frameColor]) {
    return FRAME_COLOR_OPTIONS[comp.frameColor].hex;
  }
  return '#C0C0C0'; // 기본 실버
}

function getShelfHex(comp: ClosetComponent): string {
  if (comp.shelfColor && SHELF_COLOR_OPTIONS[comp.shelfColor]) {
    return SHELF_COLOR_OPTIONS[comp.shelfColor].hex;
  }
  return '#E8DCC4'; // 기본 화이트오크
}

function getPartColor(comp: ClosetComponent, partType: string): string {
  if (partType === 'rod') return getFrameHex(comp);
  if (partType === 'shelf') return getShelfHex(comp);
  if (partType === 'drawer') return getShelfHex(comp);
  return '#9CA3AF';
}

/** Snap a value to the nearest grid increment. */
function snapToGrid(value: number, gridSizeMm: number): number {
  const unit = gridSizeMm / 100;
  return Math.round(value / unit) * unit;
}

/** Check if two AABBs overlap (scene units). */
function aabbOverlap(
  ax: number, az: number, aw: number, ad: number,
  bx: number, bz: number, bw: number, bd: number,
): boolean {
  return (
    Math.abs(ax - bx) < (aw + bw) / 2 &&
    Math.abs(az - bz) < (ad + bd) / 2
  );
}

/** Resolve position so dragged component doesn't overlap others. */
function resolveCollision(
  newX: number, newZ: number, myW: number, myD: number,
  others: { x: number; z: number; w: number; d: number }[],
): [number, number] {
  let x = newX;
  let z = newZ;

  for (const o of others) {
    if (!aabbOverlap(x, z, myW, myD, o.x, o.z, o.w, o.d)) continue;

    // Calculate minimum push distances on each axis
    const overlapX = (myW + o.w) / 2 - Math.abs(x - o.x);
    const overlapZ = (myD + o.d) / 2 - Math.abs(z - o.z);

    // Push along the axis with the smallest overlap (shortest escape)
    if (overlapX < overlapZ) {
      x += x >= o.x ? overlapX : -overlapX;
    } else {
      z += z >= o.z ? overlapZ : -overlapZ;
    }
  }

  return [x, z];
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

/**
 * Create an L-shaped corner shape for plan view.
 * armLen = arm length (scene units), armDepth = arm thickness (scene units).
 * 'L' = ㄱ (top bar + right bar), 'R' = ㄴ (left bar + bottom bar).
 */
function createCornerShape(armLen: number, armDepth: number, cornerType: CornerType): THREE.Shape {
  const W = armLen;
  const D = armDepth;
  const shape = new THREE.Shape();

  if (cornerType === 'L') {
    // ㄱ shape
    shape.moveTo(-W / 2, W / 2);
    shape.lineTo(W / 2, W / 2);
    shape.lineTo(W / 2, -W / 2);
    shape.lineTo(W / 2 - D, -W / 2);
    shape.lineTo(W / 2 - D, W / 2 - D);
    shape.lineTo(-W / 2, W / 2 - D);
  } else {
    // ㄴ shape
    shape.moveTo(-W / 2, W / 2);
    shape.lineTo(-W / 2 + D, W / 2);
    shape.lineTo(-W / 2 + D, -W / 2 + D);
    shape.lineTo(W / 2, -W / 2 + D);
    shape.lineTo(W / 2, -W / 2);
    shape.lineTo(-W / 2, -W / 2);
  }

  return shape;
}

/** Get bounding box dimensions for a component (scene units). Corner pieces have square bounding box. */
function getBoundingDims(comp: ClosetComponent): { bw: number; bd: number } {
  const cw = comp.dimensions.width / 100;
  const cd = comp.dimensions.depth / 100;
  if (comp.cornerType) return { bw: cw, bd: cw };
  return { bw: cw, bd: cd };
}

// ── 중앙 기둥 (Plan View) ──────────────────────────────

function CenterPillarPlanView({
  unitDepth,
  frameColor,
}: {
  unitDepth: number;
  frameColor: string;
}) {
  const pillarW = PILLAR_WIDTH / 100; // scene units
  return (
    <mesh position={[0, 0, 0.003]}>
      <planeGeometry args={[pillarW, unitDepth * 0.95]} />
      <meshBasicMaterial color={frameColor} opacity={0.6} transparent />
    </mesh>
  );
}

// ── 코너 기둥 (Plan View) ──────────────────────────────

function CornerPillarsPlanView({
  armLen,
  armDepth,
  cornerType,
  frameColor,
}: {
  armLen: number;
  armDepth: number;
  cornerType: CornerType;
  frameColor: string;
}) {
  const pillarW = PILLAR_WIDTH / 100;
  const isL = cornerType === 'L';

  // ㄱ: 수평팔 중심 (0, W/2 - D/2), 수직팔 중심 (W/2 - D/2, 0)
  // ㄴ: 수직팔 중심 (-W/2 + D/2, 0), 수평팔 중심 (0, -W/2 + D/2)
  const horizCenter: [number, number] = isL
    ? [0, armLen / 2 - armDepth / 2]
    : [0, -(armLen / 2 - armDepth / 2)];
  const vertCenter: [number, number] = isL
    ? [armLen / 2 - armDepth / 2, 0]
    : [-(armLen / 2 - armDepth / 2), 0];

  return (
    <group position={[0, 0, 0.003]}>
      {/* 수평팔 중앙 기둥 (depth 방향) */}
      <mesh position={[horizCenter[0], horizCenter[1], 0]}>
        <planeGeometry args={[pillarW, armDepth * 0.9]} />
        <meshBasicMaterial color={frameColor} opacity={0.6} transparent />
      </mesh>
      {/* 수직팔 중앙 기둥 (depth 방향) */}
      <mesh position={[vertCenter[0], vertCenter[1], 0]}>
        <planeGeometry args={[armDepth * 0.9, pillarW]} />
        <meshBasicMaterial color={frameColor} opacity={0.6} transparent />
      </mesh>
    </group>
  );
}

// ── 중앙 기둥 (Elevation/3D View) ──────────────────────

function CenterPillarElevationView({
  unitHeight,
  unitDepth,
  frameColor,
  is3D,
}: {
  unitHeight: number;
  unitDepth: number;
  frameColor: string;
  is3D: boolean;
}) {
  const pillarW = PILLAR_WIDTH / 100;
  return (
    <mesh position={[0, 0, is3D ? 0 : 0.05]}>
      <boxGeometry args={[pillarW, unitHeight, is3D ? unitDepth * 0.95 : 0.02]} />
      <meshStandardMaterial color={frameColor} metalness={0.4} roughness={0.3} />
    </mesh>
  );
}

/** Render internal parts (shelves and rods) as lines in plan view */
function InternalPartsPlanView({
  parts,
  component,
  unitWidth,
  unitDepth,
}: {
  parts: UnitPart[];
  component: ClosetComponent;
  unitWidth: number;
  unitDepth: number;
}) {
  const lineWidth = unitWidth * 0.9;

  return (
    <group position={[0, 0, 0.002]}>
      {parts.map((part, idx) => {
        const normalizedY = part.y / 2400;
        const zPos = (unitDepth / 2) - (normalizedY * unitDepth * 0.8) - unitDepth * 0.1;
        const color = getPartColor(component, part.type);
        const thickness = part.type === 'rod' ? 0.03 : part.type === 'drawer' ? 0.06 : 0.02;

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
  component,
  componentId,
  unitWidth,
  unitHeight,
  is3D = false,
  unitDepth = 4,
}: {
  part: UnitPart;
  component: ClosetComponent;
  componentId: string;
  unitWidth: number;
  unitHeight: number;
  is3D?: boolean;
  unitDepth?: number;
}) {
  const dispatch = useEditorDispatch();
  const { gl } = useThree();
  const meshRef = useRef<Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragStartY = useRef(0);
  const partStartY = useRef(0);

  const yPos = (part.y / 100) - (unitHeight / 2);
  const color = getPartColor(component, part.type);
  const lineWidth = unitWidth * 0.85;
  const thickness = part.type === 'rod' ? 0.08 : part.type === 'drawer' ? 0.15 : 0.05;

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

    const deltaY = dragStartY.current - e.clientY;
    const sensitivity = 5;
    let newY = partStartY.current + (deltaY * sensitivity);
    newY = Math.max(50, Math.min(2350, newY));
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

/** Render internal parts for elevation view */
function InternalPartsElevationView({
  parts,
  component,
  componentId,
  unitWidth,
  unitHeight,
}: {
  parts: UnitPart[];
  component: ClosetComponent;
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
          component={component}
          componentId={componentId}
          unitWidth={unitWidth}
          unitHeight={unitHeight}
        />
      ))}
    </group>
  );
}

/** Render internal parts for 3D view */
function InternalParts3DView({
  parts,
  component,
  componentId,
  unitWidth,
  unitHeight,
  unitDepth,
}: {
  parts: UnitPart[];
  component: ClosetComponent;
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
          component={component}
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
  const frameHex = getFrameHex(component);
  const hasFurnitureCategory = !!component.furnitureCategory;

  // Convert mm dimensions to scene units (1 unit = 100mm)
  const w = component.dimensions.width / 100;
  const h = component.dimensions.height / 100;
  const d = component.dimensions.depth / 100;
  const borderRadius = (component.borderRadius || 0) / 100;

  // Create geometry based on shape type (corner pieces use L-shape)
  const shapeGeometry = useMemo(() => {
    if (component.cornerType) {
      return new THREE.ShapeGeometry(createCornerShape(w, d, component.cornerType));
    }

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
  }, [component.shapeType, component.cornerType, w, d, borderRadius]);

  // Selection outline
  const outlineGeometry = useMemo(() => {
    if (!isSelected) return null;
    const padding = 0.02;

    if (component.cornerType) {
      return new THREE.ShapeGeometry(
        createCornerShape(w + padding * 2, d + padding * 2, component.cornerType)
      );
    }

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
  }, [isSelected, w, d, borderRadius, component.shapeType, component.cornerType]);

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

      // 코너 객체는 바운딩 박스가 정사각형 (armLen × armLen)
      const myBW = component.cornerType ? w : w;
      const myBD = component.cornerType ? w : d;

      if (snapEnabled) {
        newX = snapToGrid(newX, gridSize);
        newZ = snapToGrid(newZ, gridSize);

        const SNAP_THRESHOLD = 0.5;
        const otherComponents = components.filter((c) => c.id !== component.id && !c.locked);

        for (const other of otherComponents) {
          const { bw: otherBW, bd: otherBD } = getBoundingDims(other);
          const otherX = other.position[0];
          const otherZ = other.position[2];

          const myLeft = newX - myBW / 2;
          const otherRight = otherX + otherBW / 2;
          if (Math.abs(myLeft - otherRight) < SNAP_THRESHOLD) newX = otherRight + myBW / 2;

          const myRight = newX + myBW / 2;
          const otherLeft = otherX - otherBW / 2;
          if (Math.abs(myRight - otherLeft) < SNAP_THRESHOLD) newX = otherLeft - myBW / 2;

          const myTop = newZ - myBD / 2;
          const otherBottom = otherZ + otherBD / 2;
          if (Math.abs(myTop - otherBottom) < SNAP_THRESHOLD) newZ = otherBottom + myBD / 2;

          const myBottom = newZ + myBD / 2;
          const otherTop = otherZ - otherBD / 2;
          if (Math.abs(myBottom - otherTop) < SNAP_THRESHOLD) newZ = otherTop - myBD / 2;

          if (Math.abs(newX - otherX) < SNAP_THRESHOLD) newX = otherX;
          if (Math.abs(newZ - otherZ) < SNAP_THRESHOLD) newZ = otherZ;
        }
      }

      // ── 충돌 방지: 다른 객체와 겹치지 않도록 보정 ──
      {
        const others = components
          .filter((c) => c.id !== component.id)
          .map((c) => {
            const { bw, bd } = getBoundingDims(c);
            return { x: c.position[0], z: c.position[2], w: bw, d: bd };
          });
        [newX, newZ] = resolveCollision(newX, newZ, myBW, myBD, others);
      }

      dispatch({
        type: 'UPDATE_COMPONENT',
        payload: { id: component.id, changes: { position: [newX, 0, newZ] } },
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

  // 3D/Elevation view
  if (viewMode === '3d' || viewMode === 'elevation') {
    const is3D = viewMode === '3d';
    const matProps = {
      color: component.color,
      roughness: 0.3,
      metalness: 0 as number,
      transparent: opacity < 1 || isSelected,
      opacity: isSelected ? Math.min(opacity, 0.7) : opacity * 0.9,
    };
    const pointerHandlers = {
      onClick: handleClick,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerUp,
    };

    // ── 코너 3D/Elevation 렌더링 ──
    if (component.cornerType) {
      const isL = component.cornerType === 'L';
      // ㄱ: 수평팔(top, -Z) + 수직팔(right, +X)
      // ㄴ: 수직팔(left, -X) + 수평팔(bottom, +Z)
      const arm1Pos: [number, number, number] = isL
        ? [0, 0, -(w / 2 - d / 2)]
        : [0, 0, (w / 2 - d / 2)];
      const arm2Pos: [number, number, number] = isL
        ? [(w / 2 - d / 2), 0, 0]
        : [-(w / 2 - d / 2), 0, 0];

      return (
        <group position={[component.position[0], h / 2, component.position[2]]}>
          {/* Arm 1 (horizontal) */}
          <mesh ref={meshRef} position={arm1Pos} {...pointerHandlers}>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {/* Arm 2 (vertical) */}
          <mesh position={arm2Pos} {...pointerHandlers}>
            <boxGeometry args={[d, h, w]} />
            <meshStandardMaterial {...matProps} />
          </mesh>

          {/* Selection outline */}
          {isSelected && (
            <>
              <lineSegments position={arm1Pos}>
                <edgesGeometry args={[new THREE.BoxGeometry(w + 0.05, h + 0.05, d + 0.05)]} />
                <lineBasicMaterial color="#2563eb" linewidth={2} />
              </lineSegments>
              <lineSegments position={arm2Pos}>
                <edgesGeometry args={[new THREE.BoxGeometry(d + 0.05, h + 0.05, w + 0.05)]} />
                <lineBasicMaterial color="#2563eb" linewidth={2} />
              </lineSegments>
            </>
          )}

          {/* Label */}
          {component.label && (
            <Html center position={[0, h / 2 + 0.3, 0]} distanceFactor={15}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none', background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: '3px' }}>
                {component.label}
              </div>
            </Html>
          )}
        </group>
      );
    }

    // ── 일반 3D/Elevation 렌더링 ──
    return (
      <group position={[component.position[0], h / 2, component.position[2]]}>
        {/* Main 3D box - frame */}
        <mesh ref={meshRef} {...pointerHandlers}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial {...matProps} />
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

        {/* Center pillar */}
        {hasFurnitureCategory && (
          <CenterPillarElevationView
            unitHeight={h}
            unitDepth={d}
            frameColor={frameHex}
            is3D={is3D}
          />
        )}

        {/* Internal parts */}
        {component.parts && component.parts.length > 0 && (
          is3D ? (
            <InternalParts3DView
              parts={component.parts}
              component={component}
              componentId={component.id}
              unitWidth={w}
              unitHeight={h}
              unitDepth={d}
            />
          ) : (
            <InternalPartsElevationView
              parts={component.parts}
              component={component}
              componentId={component.id}
              unitWidth={w}
              unitHeight={h}
            />
          )
        )}

        {/* Label */}
        {component.label && (
          <Html center position={[0, h / 2 + 0.3, 0]} distanceFactor={15}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none', background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: '3px' }}>
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

      {/* Center pillar (plan view) */}
      {hasFurnitureCategory && (
        component.cornerType ? (
          <CornerPillarsPlanView
            armLen={w}
            armDepth={d}
            cornerType={component.cornerType}
            frameColor={frameHex}
          />
        ) : (
          <CenterPillarPlanView unitDepth={d} frameColor={frameHex} />
        )
      )}

      {/* Internal parts (plan view) - 코너가 아닌 경우만 */}
      {!component.cornerType && component.parts && component.parts.length > 0 && (
        <InternalPartsPlanView
          parts={component.parts}
          component={component}
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
