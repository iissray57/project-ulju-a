'use client';

import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Html } from '@react-three/drei';
import type { Group } from 'three';
import { useEditorV2, FLOOR_PATTERNS, type DoorPosition, type DoorWall } from '../editor-context-v2';
import type { ClosetComponent } from '@/lib/types/closet-editor';

// mm -> Three.js 단위 (1:1000 스케일, 1mm = 0.001 unit)
const MM_TO_UNIT = 0.001;

// ── 판재 기반 가구 상수 (실제 시스템 가구 규격) ──────────────────
const PANEL_THICKNESS = 0.018; // 판재 두께 18mm (표준 MDF/PB)
const EDGE_BAND = 0.002; // 엣지밴딩 2mm
const SHELF_THICKNESS = 0.018; // 선반 두께 18mm
const BACK_PANEL_THICKNESS = 0.008; // 뒷판 두께 8mm

// 코너 유닛: 벽과 닿지 않는 쪽 고정 깊이 (400mm)
const CORNER_LEG_DEPTH_MM = 400;

// ── 색상 상수 (고급 화이트 우드톤) ────────────────────────────────
const PANEL_COLOR = '#faf9f7'; // 화이트 오크
const PANEL_EDGE_COLOR = '#f0ede8'; // 엣지밴딩 색상
const SHELF_COLOR = '#ffffff'; // 순백색 선반
const BACK_PANEL_COLOR = '#f5f3f0'; // 뒷판 (약간 어두움)
const METAL_COLOR = '#c0c0c0'; // 금속 파츠

interface UnitMeshProps {
  component: ClosetComponent;
  isSelected: boolean;
  onClick: () => void;
}

// ── 판재 컴포넌트들 (실제 가구 구조) ─────────────────────────────

// 측판 (Side Panel) - 좌/우 수직 판재
function SidePanel({
  x, depth, height, side
}: { x: number; depth: number; height: number; side: 'left' | 'right' }) {
  const offsetX = side === 'left' ? PANEL_THICKNESS / 2 : -PANEL_THICKNESS / 2;
  return (
    <group position={[x + offsetX, height / 2, depth / 2]}>
      {/* 메인 판재 */}
      <mesh>
        <boxGeometry args={[PANEL_THICKNESS, height, depth]} />
        <meshStandardMaterial color={PANEL_COLOR} roughness={0.7} />
      </mesh>
      {/* 전면 엣지밴딩 */}
      <mesh position={[0, 0, depth / 2 - EDGE_BAND / 2]}>
        <boxGeometry args={[PANEL_THICKNESS + 0.001, height, EDGE_BAND]} />
        <meshStandardMaterial color={PANEL_EDGE_COLOR} roughness={0.5} />
      </mesh>
    </group>
  );
}

// 상판/하판 (Top/Bottom Panel) - 수평 판재
function HorizontalPanel({
  width, depth, y, type
}: { width: number; depth: number; y: number; type: 'top' | 'bottom' }) {
  const innerWidth = width - PANEL_THICKNESS * 2; // 측판 사이 내부 너비
  return (
    <group position={[width / 2, y, depth / 2]}>
      {/* 메인 판재 */}
      <mesh>
        <boxGeometry args={[innerWidth, PANEL_THICKNESS, depth]} />
        <meshStandardMaterial color={PANEL_COLOR} roughness={0.7} />
      </mesh>
      {/* 전면 엣지밴딩 */}
      <mesh position={[0, 0, depth / 2 - EDGE_BAND / 2]}>
        <boxGeometry args={[innerWidth, PANEL_THICKNESS + 0.001, EDGE_BAND]} />
        <meshStandardMaterial color={PANEL_EDGE_COLOR} roughness={0.5} />
      </mesh>
    </group>
  );
}

// 뒷판 (Back Panel) - 얇은 판재
function BackPanel({ width, height, depth }: { width: number; height: number; depth: number }) {
  const innerWidth = width - PANEL_THICKNESS * 2;
  const innerHeight = height - PANEL_THICKNESS * 2;
  return (
    <mesh position={[width / 2, height / 2, BACK_PANEL_THICKNESS / 2]}>
      <boxGeometry args={[innerWidth, innerHeight, BACK_PANEL_THICKNESS]} />
      <meshStandardMaterial color={BACK_PANEL_COLOR} roughness={0.9} />
    </mesh>
  );
}

// 선반 (Shelf) - 수평 판재 (측판 사이에 끼움)
function Shelf({
  width, depth, y
}: { width: number; depth: number; y: number }) {
  const innerWidth = width - PANEL_THICKNESS * 2; // 측판 사이
  const shelfDepth = depth - BACK_PANEL_THICKNESS - 0.005; // 뒷판 앞까지
  return (
    <group position={[width / 2, y, (depth + BACK_PANEL_THICKNESS) / 2]}>
      {/* 메인 선반 */}
      <mesh>
        <boxGeometry args={[innerWidth, SHELF_THICKNESS, shelfDepth]} />
        <meshStandardMaterial color={SHELF_COLOR} roughness={0.6} />
      </mesh>
      {/* 전면 엣지밴딩 */}
      <mesh position={[0, 0, shelfDepth / 2 - EDGE_BAND / 2]}>
        <boxGeometry args={[innerWidth, SHELF_THICKNESS + 0.001, EDGE_BAND]} />
        <meshStandardMaterial color={PANEL_EDGE_COLOR} roughness={0.5} />
      </mesh>
    </group>
  );
}

// 옷걸이 봉 (Hanging Rod) + 브래킷
function HangingRod({
  width, y, depth
}: { width: number; y: number; depth: number }) {
  const innerWidth = width - PANEL_THICKNESS * 2;
  const rodZ = (depth + BACK_PANEL_THICKNESS) / 2;
  return (
    <group>
      {/* 메인 봉 */}
      <mesh position={[width / 2, y, rodZ]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.013, 0.013, innerWidth - 0.02, 16]} />
        <meshStandardMaterial color={METAL_COLOR} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* 좌측 브래킷 */}
      <mesh position={[PANEL_THICKNESS + 0.015, y, rodZ]}>
        <boxGeometry args={[0.03, 0.04, 0.015]} />
        <meshStandardMaterial color={METAL_COLOR} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* 우측 브래킷 */}
      <mesh position={[width - PANEL_THICKNESS - 0.015, y, rodZ]}>
        <boxGeometry args={[0.03, 0.04, 0.015]} />
        <meshStandardMaterial color={METAL_COLOR} metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

// 서랍 (Drawer) - 선택적 파츠
function Drawer({
  width, depth, y, drawerHeight = 0.2
}: { width: number; depth: number; y: number; drawerHeight?: number }) {
  const innerWidth = width - PANEL_THICKNESS * 2 - 0.01;
  const drawerDepth = depth - BACK_PANEL_THICKNESS - 0.02;
  return (
    <group position={[width / 2, y + drawerHeight / 2, (depth + BACK_PANEL_THICKNESS) / 2]}>
      {/* 서랍 전면판 */}
      <mesh position={[0, 0, drawerDepth / 2 - 0.01]}>
        <boxGeometry args={[innerWidth, drawerHeight - 0.005, 0.018]} />
        <meshStandardMaterial color={PANEL_COLOR} roughness={0.6} />
      </mesh>
      {/* 서랍 손잡이 */}
      <mesh position={[0, 0, drawerDepth / 2 + 0.01]}>
        <boxGeometry args={[0.08, 0.015, 0.015]} />
        <meshStandardMaterial color={METAL_COLOR} metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

// 선반 간 높이 치수 라벨 (두 선반 사이 중앙에 표시)
function InterShelfLabel({ y1, y2, x, depth }: { y1: number; y2: number; x: number; depth: number }) {
  const midY = (y1 + y2) / 2;
  const heightDiff = Math.round((y2 - y1) / MM_TO_UNIT); // unit -> mm

  return (
    <Html
      position={[x - 0.1, midY, depth / 2]}
      center
      style={{
        background: 'rgba(59, 130, 246, 0.9)',
        color: 'white',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}
    >
      {heightDiff}
    </Html>
  );
}

function UnitMesh({ component, isSelected, onClick }: UnitMeshProps) {
  const groupRef = useRef<Group>(null);
  const { dimensions, position, rotation, cornerType, mirrored } = component;

  const width = dimensions.width * MM_TO_UNIT;
  const height = dimensions.height * MM_TO_UNIT;
  const depth = dimensions.depth * MM_TO_UNIT;

  const x = position[0] * MM_TO_UNIT;
  const z = position[2] * MM_TO_UNIT;
  const rotationY = rotation[1] || 0;

  // 코너 유닛
  if (cornerType) {
    return (
      <CornerUnitMesh
        component={component}
        isSelected={isSelected}
        onClick={onClick}
      />
    );
  }

  return (
    <group
      ref={groupRef}
      position={[x + width / 2, 0, z + depth / 2]}
      rotation={[0, rotationY, 0]}
      scale={[mirrored ? -1 : 1, 1, 1]}
      onClick={onClick}
    >
      <group position={[-width / 2, 0, -depth / 2]}>
        {/* ── 기본 박스 구조 (판재 기반) ───────────────── */}

        {/* 좌측 측판 */}
        <SidePanel x={0} depth={depth} height={height} side="left" />

        {/* 우측 측판 */}
        <SidePanel x={width} depth={depth} height={height} side="right" />

        {/* 상판 */}
        <HorizontalPanel
          width={width}
          depth={depth}
          y={height - PANEL_THICKNESS / 2}
          type="top"
        />

        {/* 하판 */}
        <HorizontalPanel
          width={width}
          depth={depth}
          y={PANEL_THICKNESS / 2}
          type="bottom"
        />

        {/* 뒷판 */}
        <BackPanel width={width} height={height} depth={depth} />

        {/* ── 내부 부품 (선반, 봉) ───────────────────── */}
        {component.parts?.map((part) => {
          const partY = part.y * MM_TO_UNIT;

          if (part.type === 'shelf') {
            return (
              <Shelf
                key={part.id}
                width={width}
                depth={depth}
                y={partY}
              />
            );
          }

          // 옷걸이 봉
          return (
            <HangingRod
              key={part.id}
              width={width}
              y={partY}
              depth={depth}
            />
          );
        })}

        {/* 선반 간 높이 치수 라벨 */}
        {(() => {
          const sortedParts = [...(component.parts || [])].sort((a, b) => a.y - b.y);
          const labels: React.ReactNode[] = [];

          for (let i = 0; i < sortedParts.length; i++) {
            const currentY = sortedParts[i].y * MM_TO_UNIT;
            const nextY = i < sortedParts.length - 1
              ? sortedParts[i + 1].y * MM_TO_UNIT
              : height;

            if (nextY > currentY) {
              labels.push(
                <InterShelfLabel
                  key={`label-${i}`}
                  y1={currentY}
                  y2={nextY}
                  x={0}
                  depth={depth}
                />
              );
            }
          }

          return labels;
        })()}

        {/* 선택 표시 */}
        {isSelected && (
          <mesh position={[width / 2, 0.001, depth / 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[width + 0.05, depth + 0.05]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
          </mesh>
        )}
      </group>
    </group>
  );
}

// ── 코너 조인트 판재 (면과 면이 정확히 만나는 구조) ─────────────────
// 버트 조인트(Butt Joint): 한 판재가 다른 판재 끝에 맞닿음
// 모든 노출면에 엣지밴딩 적용

function CornerOuterPanels({
  width, depth, height, legDepth, isL
}: {
  width: number;
  depth: number;
  height: number;
  legDepth: number;
  isL: boolean;
}) {
  // ㄱ자(L): 좌상단 코너 - 뒷벽(상단) + 좌측벽
  // ㄴ자(R): 좌하단 코너 - 좌측벽 + 하단벽

  if (isL) {
    // ── ㄱ자 코너 외곽판 ──
    return (
      <group>
        {/* 뒷벽 측판 (Z=0, X방향 전체) - 벽에 밀착 */}
        <group position={[width / 2, height / 2, PANEL_THICKNESS / 2]}>
          <mesh>
            <boxGeometry args={[width, height, PANEL_THICKNESS]} />
            <meshStandardMaterial color={PANEL_COLOR} roughness={0.7} />
          </mesh>
          {/* 전면 엣지밴딩 (안쪽으로 노출) */}
          <mesh position={[0, 0, PANEL_THICKNESS / 2 + EDGE_BAND / 2]}>
            <boxGeometry args={[width, height, EDGE_BAND]} />
            <meshStandardMaterial color={PANEL_EDGE_COLOR} roughness={0.5} />
          </mesh>
        </group>

        {/* 좌측벽 측판 (X=0, Z방향 전체) - 벽에 밀착, 뒷벽판 뒤에서 시작 */}
        <group position={[PANEL_THICKNESS / 2, height / 2, (depth + PANEL_THICKNESS) / 2]}>
          <mesh>
            <boxGeometry args={[PANEL_THICKNESS, height, depth - PANEL_THICKNESS]} />
            <meshStandardMaterial color={PANEL_COLOR} roughness={0.7} />
          </mesh>
          {/* 전면 엣지밴딩 */}
          <mesh position={[PANEL_THICKNESS / 2 + EDGE_BAND / 2, 0, 0]}>
            <boxGeometry args={[EDGE_BAND, height, depth - PANEL_THICKNESS]} />
            <meshStandardMaterial color={PANEL_EDGE_COLOR} roughness={0.5} />
          </mesh>
        </group>
      </group>
    );
  } else {
    // ── ㄴ자 코너 외곽판 ──
    return (
      <group>
        {/* 좌측벽 측판 (X=0, Z방향) */}
        <group position={[PANEL_THICKNESS / 2, height / 2, (depth - legDepth) / 2]}>
          <mesh>
            <boxGeometry args={[PANEL_THICKNESS, height, depth - legDepth]} />
            <meshStandardMaterial color={PANEL_COLOR} roughness={0.7} />
          </mesh>
          {/* 전면 엣지밴딩 */}
          <mesh position={[PANEL_THICKNESS / 2 + EDGE_BAND / 2, 0, 0]}>
            <boxGeometry args={[EDGE_BAND, height, depth - legDepth]} />
            <meshStandardMaterial color={PANEL_EDGE_COLOR} roughness={0.5} />
          </mesh>
        </group>

        {/* 하단벽 측판 (Z=depth, X방향) - 좌측판 뒤에서 시작 */}
        <group position={[(width + PANEL_THICKNESS) / 2, height / 2, depth - PANEL_THICKNESS / 2]}>
          <mesh>
            <boxGeometry args={[width - PANEL_THICKNESS, height, PANEL_THICKNESS]} />
            <meshStandardMaterial color={PANEL_COLOR} roughness={0.7} />
          </mesh>
          {/* 전면 엣지밴딩 */}
          <mesh position={[0, 0, -PANEL_THICKNESS / 2 - EDGE_BAND / 2]}>
            <boxGeometry args={[width - PANEL_THICKNESS, height, EDGE_BAND]} />
            <meshStandardMaterial color={PANEL_EDGE_COLOR} roughness={0.5} />
          </mesh>
        </group>
      </group>
    );
  }
}

// 코너 내부 판재 - L자 안쪽 코너에서 두 판이 정확히 맞닿음
function CornerInnerPanels({
  width, depth, height, legDepth, isL
}: {
  width: number;
  depth: number;
  height: number;
  legDepth: number;
  isL: boolean;
}) {
  if (isL) {
    // ── ㄱ자 내부 코너 (legDepth, legDepth 지점에서 L형 굴곡) ──
    // 수평판: legDepth~width 구간, Z=legDepth 위치
    // 수직판: X=legDepth 위치, legDepth~depth 구간
    const horizPanelWidth = width - legDepth - PANEL_THICKNESS; // 좌측 외곽판 제외
    const vertPanelDepth = depth - legDepth - PANEL_THICKNESS; // 뒷벽 외곽판 제외

    return (
      <group>
        {/* 수평 내부판 (가로로 뻗음) */}
        <group position={[(legDepth + width) / 2, height / 2, legDepth - PANEL_THICKNESS / 2]}>
          <mesh>
            <boxGeometry args={[horizPanelWidth, height, PANEL_THICKNESS]} />
            <meshStandardMaterial color={PANEL_COLOR} roughness={0.7} />
          </mesh>
          {/* 상단(뒤쪽) 엣지밴딩 */}
          <mesh position={[0, 0, -PANEL_THICKNESS / 2 - EDGE_BAND / 2]}>
            <boxGeometry args={[horizPanelWidth, height, EDGE_BAND]} />
            <meshStandardMaterial color={PANEL_EDGE_COLOR} roughness={0.5} />
          </mesh>
          {/* 우측 끝단 엣지밴딩 */}
          <mesh position={[horizPanelWidth / 2 + EDGE_BAND / 2, 0, 0]}>
            <boxGeometry args={[EDGE_BAND, height, PANEL_THICKNESS]} />
            <meshStandardMaterial color={PANEL_EDGE_COLOR} roughness={0.5} />
          </mesh>
        </group>

        {/* 수직 내부판 (세로로 뻗음) - 수평판에 버트 조인트 */}
        <group position={[legDepth - PANEL_THICKNESS / 2, height / 2, legDepth + vertPanelDepth / 2]}>
          <mesh>
            <boxGeometry args={[PANEL_THICKNESS, height, vertPanelDepth]} />
            <meshStandardMaterial color={PANEL_COLOR} roughness={0.7} />
          </mesh>
          {/* 우측 엣지밴딩 */}
          <mesh position={[PANEL_THICKNESS / 2 + EDGE_BAND / 2, 0, 0]}>
            <boxGeometry args={[EDGE_BAND, height, vertPanelDepth]} />
            <meshStandardMaterial color={PANEL_EDGE_COLOR} roughness={0.5} />
          </mesh>
          {/* 하단 끝단 엣지밴딩 */}
          <mesh position={[0, 0, vertPanelDepth / 2 + EDGE_BAND / 2]}>
            <boxGeometry args={[PANEL_THICKNESS, height, EDGE_BAND]} />
            <meshStandardMaterial color={PANEL_EDGE_COLOR} roughness={0.5} />
          </mesh>
        </group>

        {/* 코너 조인트 보강재 (두 판이 만나는 L자 모서리) */}
        <mesh position={[legDepth - PANEL_THICKNESS / 2, height / 2, legDepth - PANEL_THICKNESS / 2]}>
          <boxGeometry args={[PANEL_THICKNESS, height, PANEL_THICKNESS]} />
          <meshStandardMaterial color={PANEL_EDGE_COLOR} roughness={0.6} />
        </mesh>
      </group>
    );
  } else {
    // ── ㄴ자 내부 코너 ──
    const horizPanelWidth = width - legDepth - PANEL_THICKNESS;
    const vertPanelDepth = depth - legDepth - PANEL_THICKNESS;

    return (
      <group>
        {/* 수직 내부판 */}
        <group position={[legDepth - PANEL_THICKNESS / 2, height / 2, vertPanelDepth / 2 + PANEL_THICKNESS]}>
          <mesh>
            <boxGeometry args={[PANEL_THICKNESS, height, vertPanelDepth]} />
            <meshStandardMaterial color={PANEL_COLOR} roughness={0.7} />
          </mesh>
          {/* 우측 엣지밴딩 */}
          <mesh position={[PANEL_THICKNESS / 2 + EDGE_BAND / 2, 0, 0]}>
            <boxGeometry args={[EDGE_BAND, height, vertPanelDepth]} />
            <meshStandardMaterial color={PANEL_EDGE_COLOR} roughness={0.5} />
          </mesh>
        </group>

        {/* 수평 내부판 - 수직판에 버트 조인트 */}
        <group position={[legDepth + horizPanelWidth / 2, height / 2, depth - legDepth + PANEL_THICKNESS / 2]}>
          <mesh>
            <boxGeometry args={[horizPanelWidth, height, PANEL_THICKNESS]} />
            <meshStandardMaterial color={PANEL_COLOR} roughness={0.7} />
          </mesh>
          {/* 전면 엣지밴딩 */}
          <mesh position={[0, 0, -PANEL_THICKNESS / 2 - EDGE_BAND / 2]}>
            <boxGeometry args={[horizPanelWidth, height, EDGE_BAND]} />
            <meshStandardMaterial color={PANEL_EDGE_COLOR} roughness={0.5} />
          </mesh>
        </group>

        {/* 코너 조인트 보강재 */}
        <mesh position={[legDepth - PANEL_THICKNESS / 2, height / 2, depth - legDepth + PANEL_THICKNESS / 2]}>
          <boxGeometry args={[PANEL_THICKNESS, height, PANEL_THICKNESS]} />
          <meshStandardMaterial color={PANEL_EDGE_COLOR} roughness={0.6} />
        </mesh>
      </group>
    );
  }
}

// 코너 선반 (L자 형태)
function CornerShelf({
  width, depth, y, legDepth, isL
}: { width: number; depth: number; y: number; legDepth: number; isL: boolean }) {
  if (isL) {
    return (
      <group>
        {/* 세로 섹션 선반 */}
        <mesh position={[legDepth / 2, y, depth / 2]}>
          <boxGeometry args={[legDepth - PANEL_THICKNESS * 2, SHELF_THICKNESS, depth - PANEL_THICKNESS]} />
          <meshStandardMaterial color={SHELF_COLOR} roughness={0.6} />
        </mesh>
        {/* 가로 섹션 선반 */}
        <mesh position={[(width + legDepth) / 2, y, legDepth / 2]}>
          <boxGeometry args={[width - legDepth - PANEL_THICKNESS, SHELF_THICKNESS, legDepth - PANEL_THICKNESS * 2]} />
          <meshStandardMaterial color={SHELF_COLOR} roughness={0.6} />
        </mesh>
      </group>
    );
  } else {
    return (
      <group>
        {/* 세로 섹션 선반 */}
        <mesh position={[legDepth / 2, y, (depth - legDepth) / 2]}>
          <boxGeometry args={[legDepth - PANEL_THICKNESS * 2, SHELF_THICKNESS, depth - legDepth - PANEL_THICKNESS]} />
          <meshStandardMaterial color={SHELF_COLOR} roughness={0.6} />
        </mesh>
        {/* 가로 섹션 선반 */}
        <mesh position={[width / 2, y, depth - legDepth / 2]}>
          <boxGeometry args={[width - PANEL_THICKNESS, SHELF_THICKNESS, legDepth - PANEL_THICKNESS * 2]} />
          <meshStandardMaterial color={SHELF_COLOR} roughness={0.6} />
        </mesh>
      </group>
    );
  }
}

function CornerUnitMesh({ component, isSelected, onClick }: UnitMeshProps) {
  const { dimensions, position, rotation, cornerType, mirrored } = component;

  const width = dimensions.width * MM_TO_UNIT;
  const height = dimensions.height * MM_TO_UNIT;
  const depth = dimensions.depth * MM_TO_UNIT;
  const legDepth = CORNER_LEG_DEPTH_MM * MM_TO_UNIT;

  const x = position[0] * MM_TO_UNIT;
  const z = position[2] * MM_TO_UNIT;
  const rotationY = rotation[1] || 0;

  const isL = cornerType === 'L';
  const flipX = mirrored ? -1 : 1;

  return (
    <group
      position={[x + width / 2, 0, z + depth / 2]}
      rotation={[0, rotationY, 0]}
      scale={[flipX, 1, 1]}
      onClick={onClick}
    >
      <group position={[-width / 2, 0, -depth / 2]}>
        {/* ── 외곽 판재 (벽과 닿는 면) - 버트 조인트 적용 ───── */}
        <CornerOuterPanels
          width={width} depth={depth} height={height}
          legDepth={legDepth} isL={isL}
        />

        {/* ── 내부 코너 판재 - L자 굴곡점 정확 처리 ─────── */}
        <CornerInnerPanels
          width={width} depth={depth} height={height}
          legDepth={legDepth} isL={isL}
        />

        {/* ── 상판 (L자 형태) ─────────────────────── */}
        <CornerShelf
          width={width} depth={depth}
          y={height - PANEL_THICKNESS / 2}
          legDepth={legDepth} isL={isL}
        />

        {/* ── 하판 (L자 형태) ─────────────────────── */}
        <CornerShelf
          width={width} depth={depth}
          y={PANEL_THICKNESS / 2}
          legDepth={legDepth} isL={isL}
        />

        {/* ── 내부 선반들 ─────────────────────────── */}
        {component.parts?.filter(p => p.type === 'shelf').map((part) => (
          <CornerShelf
            key={part.id}
            width={width} depth={depth}
            y={part.y * MM_TO_UNIT}
            legDepth={legDepth} isL={isL}
          />
        ))}

        {/* 선반 간 높이 치수 라벨 */}
        {(() => {
          const sortedParts = [...(component.parts || [])].filter(p => p.type === 'shelf').sort((a, b) => a.y - b.y);
          const labels: React.ReactNode[] = [];
          for (let i = 0; i < sortedParts.length; i++) {
            const currentY = sortedParts[i].y * MM_TO_UNIT;
            const nextY = i < sortedParts.length - 1 ? sortedParts[i + 1].y * MM_TO_UNIT : height;
            if (nextY > currentY) {
              labels.push(<InterShelfLabel key={`label-${i}`} y1={currentY} y2={nextY} x={0} depth={depth} />);
            }
          }
          return labels;
        })()}

        {/* 선택 표시 */}
        {isSelected && (
          <mesh position={[width / 2, 0.001, depth / 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[width + 0.05, depth + 0.05]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
          </mesh>
        )}
      </group>
    </group>
  );
}

// 방 출입문 컴포넌트
function RoomEntryDoor({
  roomWidth,
  roomDepth,
  door,
}: {
  roomWidth: number;
  roomDepth: number;
  door: DoorPosition;
}) {
  const doorWidth = door.width * MM_TO_UNIT;
  const doorHeight = 2.1; // 2100mm
  const doorThickness = 0.05;
  const offset = door.offset * MM_TO_UNIT;

  // 벽에 따른 문 위치 및 회전 계산
  const getDoorTransform = (): { position: [number, number, number]; rotation: number } => {
    switch (door.wall) {
      case 'left':
        return { position: [-doorThickness / 2, 0, offset + doorWidth / 2], rotation: Math.PI };
      case 'top':
        return { position: [offset + doorWidth / 2, 0, -doorThickness / 2], rotation: Math.PI / 2 };
      case 'right':
        return { position: [roomWidth + doorThickness / 2, 0, offset + doorWidth / 2], rotation: 0 };
      case 'bottom':
        return { position: [offset + doorWidth / 2, 0, roomDepth + doorThickness / 2], rotation: -Math.PI / 2 };
    }
  };

  const { position, rotation } = getDoorTransform();
  const openAngle = door.isOpen ? (door.openDirection === 'inward' ? Math.PI * 0.25 : -Math.PI * 0.25) : 0;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* 문틀 */}
      <mesh position={[0, doorHeight / 2, 0]}>
        <boxGeometry args={[doorThickness, doorHeight + 0.1, doorWidth + 0.1]} />
        <meshStandardMaterial color="#d4c4a8" />
      </mesh>

      {/* 문짝 */}
      <group position={[0, 0, -doorWidth / 2]} rotation={[0, openAngle, 0]}>
        <mesh position={[doorThickness, doorHeight / 2, doorWidth / 2]}>
          <boxGeometry args={[doorThickness * 0.8, doorHeight - 0.05, doorWidth - 0.02]} />
          <meshStandardMaterial color="#f5f0e8" />
        </mesh>

        {/* 문 손잡이 */}
        <mesh position={[doorThickness * 1.5, doorHeight * 0.45, doorWidth - 0.1]}>
          <cylinderGeometry args={[0.015, 0.015, 0.1, 8]} />
          <meshStandardMaterial color="#a0a0a0" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

// 방 환경 컴포넌트 (바닥 + 벽 + 출입문)
function RoomEnvironment({
  roomWidth,
  roomDepth,
  floorPattern,
  door,
}: {
  roomWidth: number;
  roomDepth: number;
  floorPattern: keyof typeof FLOOR_PATTERNS;
  door: DoorPosition;
}) {
  const width = roomWidth * MM_TO_UNIT;
  const depth = roomDepth * MM_TO_UNIT;
  const wallHeight = 2.8; // 2.8m 천장 높이

  // 바닥 색상 (선택된 패턴에 따라)
  const pattern = FLOOR_PATTERNS[floorPattern];
  const floorColor = pattern.color;
  const lineColor = pattern.lineColor;
  // 벽 색상 (따뜻한 화이트)
  const wallColor = '#faf8f5';

  return (
    <group>
      {/* 바닥 - 원목 느낌 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, -0.005, depth / 2]} receiveShadow>
        <planeGeometry args={[width + 1, depth + 1]} />
        <meshStandardMaterial color={floorColor} roughness={0.8} />
      </mesh>

      {/* 바닥 패턴 라인 (원목 무늬 효과) */}
      {Array.from({ length: Math.ceil((width + 1) / 0.15) }).map((_, i) => (
        <mesh
          key={`floor-line-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-0.5 + i * 0.15, -0.004, depth / 2]}
        >
          <planeGeometry args={[0.002, depth + 1]} />
          <meshBasicMaterial color={lineColor} transparent opacity={0.3} />
        </mesh>
      ))}

      {/* 뒷벽 */}
      <mesh position={[width / 2, wallHeight / 2, -0.01]} receiveShadow>
        <planeGeometry args={[width + 1, wallHeight]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {/* 왼쪽 벽 */}
      <mesh position={[-0.01, wallHeight / 2, depth / 2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth + 1, wallHeight]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {/* 벽-바닥 몰딩 (걸레받이) */}
      <mesh position={[width / 2, 0.04, 0.02]}>
        <boxGeometry args={[width + 0.5, 0.08, 0.02]} />
        <meshStandardMaterial color="#f0ebe0" />
      </mesh>
      <mesh position={[0.02, 0.04, depth / 2]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[depth + 0.5, 0.08, 0.02]} />
        <meshStandardMaterial color="#f0ebe0" />
      </mesh>

      {/* 천장-벽 몰딩 (크라운 몰딩) */}
      <mesh position={[width / 2, wallHeight - 0.03, 0.015]}>
        <boxGeometry args={[width + 0.5, 0.06, 0.03]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.015, wallHeight - 0.03, depth / 2]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[depth + 0.5, 0.06, 0.03]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* 방 출입문 */}
      <RoomEntryDoor roomWidth={width} roomDepth={depth} door={door} />
    </group>
  );
}

function Scene() {
  const { state, dispatch } = useEditorV2();
  const { components, selectedId, roomWidth, roomDepth, floorPattern, door } = state;

  const handleSelect = (id: string) => {
    dispatch({ type: 'SELECT_COMPONENT', payload: id });
  };

  const roomW = roomWidth * MM_TO_UNIT;
  const roomD = roomDepth * MM_TO_UNIT;

  return (
    <>
      {/* Camera - 코너에서 보는 인테리어 뷰 */}
      <PerspectiveCamera
        makeDefault
        position={[roomW * 1.2, 1.8, roomD * 1.5]}
        fov={45}
      />

      {/* 조명 - 자연스러운 실내 조명 */}
      <ambientLight intensity={0.4} color="#fff9f0" />

      {/* 메인 조명 (천장 조명 느낌) */}
      <directionalLight
        position={[roomW / 2, 4, roomD / 2]}
        intensity={0.8}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />

      {/* 창문 빛 느낌 (우측에서) */}
      <directionalLight
        position={[roomW + 2, 2, roomD / 2]}
        intensity={0.5}
        color="#fff5e6"
      />

      {/* 부드러운 채움 조명 */}
      <pointLight position={[roomW / 2, 2.5, roomD]} intensity={0.3} color="#ffeedd" />

      {/* Controls */}
      <OrbitControls
        target={[roomW / 2, 1.2, roomD / 2]}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={0.1}
        minDistance={1.5}
        maxDistance={10}
        enableDamping
        dampingFactor={0.05}
      />

      {/* 방 환경 (바닥 + 벽 + 출입문) */}
      <RoomEnvironment roomWidth={roomWidth} roomDepth={roomDepth} floorPattern={floorPattern} door={door} />

      {/* Units */}
      {components.map((comp) => (
        <UnitMesh
          key={comp.id}
          component={comp}
          isSelected={selectedId === comp.id}
          onClick={() => handleSelect(comp.id)}
        />
      ))}

      {/* Environment - 부드러운 환경광 */}
      <Environment preset="apartment" background={false} />
    </>
  );
}

export function ThreeView() {
  const { state, dispatch } = useEditorV2();
  const { floorPattern } = state;

  return (
    <div className="relative h-full w-full">
      {/* 그라데이션 배경 (하늘 느낌) */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-100 via-sky-50 to-white" />

      <Canvas shadows className="relative z-10">
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {/* 조작 안내 */}
      <div className="absolute bottom-3 left-3 rounded-xl bg-white/95 px-4 py-3 text-xs text-slate-600 shadow-lg backdrop-blur">
        <p className="mb-1 font-medium text-slate-700">🖱️ 조작 방법</p>
        <p>드래그: 회전 · 스크롤: 줌</p>
        <p>우클릭 드래그: 이동</p>
      </div>

      {/* 뷰 모드 표시 */}
      <div className="absolute left-3 top-3 rounded-xl bg-white/95 px-4 py-2 shadow-lg backdrop-blur">
        <p className="text-xs font-medium text-slate-700">🏠 인테리어 뷰</p>
        <p className="text-[10px] text-slate-500">드레스룸 시뮬레이션</p>
      </div>

      {/* 바닥 패턴 선택 - 오버플로우 방지 */}
      <div className="absolute right-3 top-3 max-w-[200px] rounded-xl bg-white/95 p-3 shadow-lg backdrop-blur">
        <p className="mb-2 text-xs font-medium text-slate-700">🪵 바닥 패턴</p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(FLOOR_PATTERNS) as Array<keyof typeof FLOOR_PATTERNS>).map((key) => (
            <button
              key={key}
              onClick={() => dispatch({ type: 'SET_FLOOR_PATTERN', payload: key })}
              className={`h-7 w-7 rounded-lg border-2 transition-all ${
                floorPattern === key
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-transparent hover:border-slate-300'
              }`}
              style={{ backgroundColor: FLOOR_PATTERNS[key].color }}
              title={FLOOR_PATTERNS[key].name}
            />
          ))}
        </div>
        <p className="mt-1.5 text-center text-[10px] text-slate-500">
          {FLOOR_PATTERNS[floorPattern].name}
        </p>
      </div>

      {/* 디자인 팁 */}
      <div className="absolute bottom-3 right-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-xs text-white shadow-lg">
        <p className="font-medium">💡 평면도에서 유닛을 배치하세요</p>
      </div>
    </div>
  );
}
