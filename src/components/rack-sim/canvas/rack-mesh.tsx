'use client';

import { useRef, useMemo } from 'react';
import { Group } from 'three';
import type { RackItem } from '../types';

// ---------------------------------------------------------------------------
// Unit conversion: mm -> Three.js world units (1mm = 0.001)
// ---------------------------------------------------------------------------
const MM = 0.001;

// Angle iron profile (L-shape approximated by 2 thin boxes)
const ANGLE_SIZE = 30 * MM;         // 30mm flange
const ANGLE_THICKNESS = 2.5 * MM;   // 2.5mm wall thickness
// Crossbar flat bar
const CROSSBAR_H = 20 * MM;         // height of crossbar
const CROSSBAR_T = 2 * MM;          // thickness of crossbar
// Shelf board
const SHELF_T = 18 * MM;            // MDF thickness

// Base accessories
const FOOT_R = 18 * MM;             // leveling foot radius
const FOOT_H = 40 * MM;             // leveling foot height
const SMALL_WHEEL_R = 25 * MM;
const LARGE_WHEEL_R = 40 * MM;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** One L-angle post (vertical). Approximated by two thin boxes at 90°. */
function AnglePost({
  height,
  color,
  position,
}: {
  height: number;
  color: string;
  position: [number, number, number];
}) {
  const h = height * MM;
  const s = ANGLE_SIZE;
  const t = ANGLE_THICKNESS;
  const y = h / 2;

  return (
    <group position={position}>
      {/* Flange 1 – faces front */}
      <mesh position={[s / 2 - t / 2, y, 0]} castShadow>
        <boxGeometry args={[t, h, s]} />
        <meshStandardMaterial color={color} metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Flange 2 – faces side */}
      <mesh position={[0, y, s / 2 - t / 2]} castShadow>
        <boxGeometry args={[s - t, h, t]} />
        <meshStandardMaterial color={color} metalness={0.85} roughness={0.25} />
      </mesh>
    </group>
  );
}

/** Horizontal crossbar along X (width direction). */
function CrossbarX({
  length,
  color,
  position,
}: {
  length: number;
  color: string;
  position: [number, number, number];
}) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[length, CROSSBAR_H, CROSSBAR_T]} />
      <meshStandardMaterial color={color} metalness={0.85} roughness={0.25} />
    </mesh>
  );
}

/** Horizontal crossbar along Z (depth direction). */
function CrossbarZ({
  length,
  color,
  position,
}: {
  length: number;
  color: string;
  position: [number, number, number];
}) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[CROSSBAR_T, CROSSBAR_H, length]} />
      <meshStandardMaterial color={color} metalness={0.85} roughness={0.25} />
    </mesh>
  );
}

/** Shelf board. */
function ShelfBoard({
  width,
  depth,
  position,
}: {
  width: number;
  depth: number;
  position: [number, number, number];
}) {
  const w = width * MM - ANGLE_SIZE * 2;  // inset to sit inside posts
  const d = depth * MM - ANGLE_SIZE * 2;
  return (
    <mesh position={position} receiveShadow castShadow>
      <boxGeometry args={[w, SHELF_T, d]} />
      <meshStandardMaterial color="#D4C4A0" roughness={0.7} metalness={0.0} />
    </mesh>
  );
}

/** Leveling foot cylinder. */
function LevelingFoot({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Stem */}
      <mesh position={[0, FOOT_H * 0.6, 0]} castShadow>
        <cylinderGeometry args={[FOOT_R * 0.4, FOOT_R * 0.4, FOOT_H * 0.7, 12]} />
        <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Base pad */}
      <mesh position={[0, FOOT_H * 0.1, 0]} castShadow>
        <cylinderGeometry args={[FOOT_R, FOOT_R, FOOT_H * 0.2, 16]} />
        <meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Caster wheel. */
function Wheel({
  position,
  radius,
  color,
}: {
  position: [number, number, number];
  radius: number;
  color: string;
}) {
  const stemH = radius * 1.2;
  return (
    <group position={position}>
      {/* Bracket stem */}
      <mesh position={[0, stemH * 0.5 + radius, 0]} castShadow>
        <boxGeometry args={[radius * 0.6, stemH, radius * 0.6]} />
        <meshStandardMaterial color="#666" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Wheel */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, radius, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, radius * 0.5, 20]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Side safety bar (runs along depth at mid-shelf). */
function SafetyBar({
  depth,
  color,
  positionX,
  positionY,
  positionZ,
}: {
  depth: number;
  color: string;
  positionX: number;
  positionY: number;
  positionZ: number;
}) {
  const d = depth * MM - ANGLE_SIZE * 2;
  return (
    <mesh position={[positionX, positionY, positionZ]} castShadow>
      <boxGeometry args={[CROSSBAR_T, CROSSBAR_H * 0.6, d]} />
      <meshStandardMaterial color={color} metalness={0.85} roughness={0.3} />
    </mesh>
  );
}

/** Hanger rod with brackets (for hanger product type). */
function HangerBar({
  width,
  color,
  position,
}: {
  width: number;
  color: string;
  position: [number, number, number];
}) {
  const w = width * MM - ANGLE_SIZE * 2;
  return (
    <group position={position}>
      {/* Rod */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[8 * MM, 8 * MM, w, 16]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Left bracket */}
      <mesh position={[-w / 2, 0, 0]} castShadow>
        <boxGeometry args={[20 * MM, 15 * MM, 20 * MM]} />
        <meshStandardMaterial color={color} metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Right bracket */}
      <mesh position={[w / 2, 0, 0]} castShadow>
        <boxGeometry args={[20 * MM, 15 * MM, 20 * MM]} />
        <meshStandardMaterial color={color} metalness={0.85} roughness={0.25} />
      </mesh>
    </group>
  );
}

/** Translucent curtain plane. */
function CurtainPlane({
  width,
  height,
  position,
  rotation,
  color,
}: {
  width: number;
  height: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={position} rotation={rotation ?? [0, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        color={color ?? '#AACCFF'}
        transparent
        opacity={0.18}
        side={2}
        roughness={0.1}
        metalness={0}
      />
    </mesh>
  );
}

/** Mesh board (wireframe-ish) on sides. Uses a grid of thin bars. */
function MeshBoard({
  width,
  height,
  position,
  rotation,
  color,
}: {
  width: number;
  height: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} rotation={rotation ?? [0, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        color={color}
        wireframe
        transparent
        opacity={0.6}
        metalness={0.5}
        roughness={0.3}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Selection ring (ground glow)
// ---------------------------------------------------------------------------
function SelectionGlow({ width, depth }: { width: number; depth: number }) {
  const w = width * MM + 0.04;
  const d = depth * MM + 0.04;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial
        color="#4A9EFF"
        transparent
        opacity={0.25}
        emissive="#4A9EFF"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Main RackMesh component
// ---------------------------------------------------------------------------

interface RackMeshProps {
  item: RackItem;
  isSelected: boolean;
  onClick: () => void;
}

export function RackMesh({ item, isSelected, onClick }: RackMeshProps) {
  const groupRef = useRef<Group>(null);

  const {
    width: W,   // mm
    depth: D,   // mm
    height: H,  // mm
    shelfCount,
    options,
    baseType,
    color,
    productType,
  } = item;

  // Three.js unit conversions
  const w = W * MM;
  const d = D * MM;
  const h = H * MM;

  // Base height offset (feet/wheels lift the rack)
  const baseH =
    baseType === 'large_wheel'
      ? LARGE_WHEEL_R * 2 + LARGE_WHEEL_R * 1.2
      : baseType === 'small_wheel'
        ? SMALL_WHEEL_R * 2 + SMALL_WHEEL_R * 1.2
        : FOOT_H;  // leveling foot

  // Post corner positions (local XZ)
  const corners: [number, number][] = [
    [0, 0],
    [w, 0],
    [0, d],
    [w, d],
  ];

  // Shelf levels
  const skippedBottom = productType === 'washing' ? 2 : productType === 'bottom_open' ? 1 : 0;
  const totalShelves = shelfCount;

  // Evenly space shelves across total height
  const shelfYPositions = useMemo(() => {
    const levels: number[] = [];
    for (let i = 0; i < totalShelves; i++) {
      const t = i / (totalShelves - 1);
      const y = baseH + t * h;
      levels.push(y);
    }
    return levels;
  }, [totalShelves, baseH, h]);

  // Active shelf positions (skip bottom levels per product type)
  const activeShelfYPositions = shelfYPositions.slice(skippedBottom);

  // Has options
  const hasSafetyBar = options.includes('side_safety_bar');
  const hasFrontCurtain = options.includes('front_curtain');
  const hasSideCurtain = options.includes('side_curtain');
  const hasMeshBoard = options.includes('mesh_board');

  // Curtain / mesh board dimensions
  const curtainHeight = h;
  const curtainY = baseH + h / 2;

  // Rack center offset so it's centered at XZ = 0
  const cx = -w / 2;
  const cz = -d / 2;

  const rotationY = ((item.rotation ?? 0) * Math.PI) / 180;

  return (
    <group ref={groupRef} rotation={[0, rotationY, 0]} position={[cx, 0, cz]} onClick={(e) => { e.stopPropagation(); onClick(); }}>

      {/* ---- POSTS (4 vertical L-angle irons) ---- */}
      {corners.map(([px, pz], i) => (
        <AnglePost
          key={`post-${i}`}
          height={H}
          color={color}
          position={[px, baseH, pz]}
        />
      ))}

      {/* ---- CROSSBARS at each shelf level ---- */}
      {shelfYPositions.map((y, lvl) => {
        const cy = y + SHELF_T;
        // Front & back bars (along X)
        const frontZ = ANGLE_SIZE / 2;
        const backZ = d - ANGLE_SIZE / 2;
        // Left & right bars (along Z)
        const leftX = ANGLE_SIZE / 2;
        const rightX = w - ANGLE_SIZE / 2;
        const barLen = w - ANGLE_SIZE;
        const barDepth = d - ANGLE_SIZE;

        return (
          <group key={`crossbars-${lvl}`}>
            <CrossbarX length={barLen} color={color} position={[w / 2, cy, frontZ]} />
            <CrossbarX length={barLen} color={color} position={[w / 2, cy, backZ]} />
            <CrossbarZ length={barDepth} color={color} position={[leftX, cy, d / 2]} />
            <CrossbarZ length={barDepth} color={color} position={[rightX, cy, d / 2]} />
          </group>
        );
      })}

      {/* ---- SHELVES (only active levels) ---- */}
      {activeShelfYPositions.map((y, i) => {
        // For hanger type: replace the topmost shelf with a hanger rod
        const isTopShelf = i === activeShelfYPositions.length - 1;
        if (productType === 'hanger' && isTopShelf) {
          return (
            <HangerBar
              key={`hanger-${i}`}
              width={W}
              color={color}
              position={[w / 2, y + SHELF_T, d / 2]}
            />
          );
        }
        return (
          <ShelfBoard
            key={`shelf-${i}`}
            width={W}
            depth={D}
            position={[w / 2, y + SHELF_T / 2, d / 2]}
          />
        );
      })}

      {/* ---- BASE ACCESSORIES ---- */}
      {corners.map(([px, pz], i) => {
        if (baseType === 'leveling_foot') {
          return (
            <LevelingFoot
              key={`foot-${i}`}
              position={[px + ANGLE_SIZE / 2, 0, pz + ANGLE_SIZE / 2]}
            />
          );
        }
        if (baseType === 'small_wheel') {
          return (
            <Wheel
              key={`wheel-${i}`}
              position={[px + ANGLE_SIZE / 2, 0, pz + ANGLE_SIZE / 2]}
              radius={SMALL_WHEEL_R}
              color="#333"
            />
          );
        }
        if (baseType === 'large_wheel') {
          return (
            <Wheel
              key={`wheel-${i}`}
              position={[px + ANGLE_SIZE / 2, 0, pz + ANGLE_SIZE / 2]}
              radius={LARGE_WHEEL_R}
              color="#222"
            />
          );
        }
        return null;
      })}

      {/* ---- SIDE SAFETY BARS ---- */}
      {hasSafetyBar && activeShelfYPositions.slice(0, -1).map((y, i) => {
        const midY = y + (activeShelfYPositions[i + 1] - y) / 2;
        return (
          <group key={`safety-${i}`}>
            {/* Left side */}
            <SafetyBar depth={D} color={color} positionX={ANGLE_SIZE / 2} positionY={midY} positionZ={d / 2} />
            {/* Right side */}
            <SafetyBar depth={D} color={color} positionX={w - ANGLE_SIZE / 2} positionY={midY} positionZ={d / 2} />
          </group>
        );
      })}

      {/* ---- FRONT CURTAIN ---- */}
      {hasFrontCurtain && (
        <CurtainPlane
          width={w - ANGLE_SIZE}
          height={curtainHeight}
          position={[w / 2, curtainY, ANGLE_SIZE / 2]}
          rotation={[0, 0, 0]}
          color="#AACCFF"
        />
      )}

      {/* ---- SIDE CURTAINS ---- */}
      {hasSideCurtain && (
        <>
          <CurtainPlane
            width={d - ANGLE_SIZE}
            height={curtainHeight}
            position={[ANGLE_SIZE / 2, curtainY, d / 2]}
            rotation={[0, Math.PI / 2, 0]}
            color="#AACCFF"
          />
          <CurtainPlane
            width={d - ANGLE_SIZE}
            height={curtainHeight}
            position={[w - ANGLE_SIZE / 2, curtainY, d / 2]}
            rotation={[0, -Math.PI / 2, 0]}
            color="#AACCFF"
          />
        </>
      )}

      {/* ---- MESH BOARDS (sides) ---- */}
      {hasMeshBoard && (
        <>
          <MeshBoard
            width={d - ANGLE_SIZE}
            height={curtainHeight}
            position={[ANGLE_SIZE / 2, curtainY, d / 2]}
            rotation={[0, Math.PI / 2, 0]}
            color={color}
          />
          <MeshBoard
            width={d - ANGLE_SIZE}
            height={curtainHeight}
            position={[w - ANGLE_SIZE / 2, curtainY, d / 2]}
            rotation={[0, -Math.PI / 2, 0]}
            color={color}
          />
        </>
      )}

      {/* ---- SELECTION GLOW ---- */}
      {isSelected && <SelectionGlow width={W} depth={D} />}
    </group>
  );
}
