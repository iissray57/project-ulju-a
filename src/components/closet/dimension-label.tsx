'use client';

import { Html } from '@react-three/drei';
import type { ClosetComponent } from '@/lib/types/closet-editor';

interface DimensionLabelProps {
  component: ClosetComponent;
}

const labelStyle: React.CSSProperties = {
  background: 'rgba(37, 99, 235, 0.85)',
  color: '#fff',
  fontSize: '11px',
  fontFamily: 'var(--font-mono, monospace)',
  padding: '1px 3px',
  borderRadius: '2px',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  userSelect: 'none',
  lineHeight: '1.2',
};

/**
 * 2D 탑다운 뷰 치수 라벨 - 도형 각 변에 밀착 표시
 * distanceFactor로 씬 스케일에 비례하여 크기 조절
 */
export function DimensionLabel({ component }: DimensionLabelProps) {
  const w = component.dimensions.width / 100;
  const d = component.dimensions.depth / 100;
  const [cx, , cz] = component.position;

  return (
    <group>
      {/* 가로(W) - 상단 변 중앙 */}
      <Html
        position={[cx, 0.02, cz - d / 2 - 0.05]}
        center
        distanceFactor={8}
        zIndexRange={[10, 0]}
      >
        <div style={labelStyle}>
          {component.dimensions.width}
        </div>
      </Html>

      {/* 세로(D) - 우측 변 중앙 */}
      <Html
        position={[cx + w / 2 + 0.05, 0.02, cz]}
        center
        distanceFactor={8}
        zIndexRange={[10, 0]}
      >
        <div style={labelStyle}>
          {component.dimensions.depth}
        </div>
      </Html>
    </group>
  );
}
