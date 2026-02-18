'use client';

import { Text } from '@react-three/drei';
import type { ClosetComponent, ViewMode } from '@/lib/types/closet-editor';

interface DimensionLabelProps {
  component: ClosetComponent;
  viewMode: ViewMode;
}

// 텍스트 크기 (3D 씬 단위 - 컴포넌트 대비 작게)
const LABEL_SIZE = 0.08;
const PART_LABEL_SIZE = 0.06;

/**
 * 치수 라벨 - 뷰 모드에 따라 다르게 표시
 */
export function DimensionLabel({ component, viewMode }: DimensionLabelProps) {
  const w = component.dimensions.width / 100;
  const h = component.dimensions.height / 100;
  const d = component.dimensions.depth / 100;
  const [cx, , cz] = component.position;

  // 평면도: 가로, 세로 표시
  if (viewMode === 'plan') {
    return (
      <group>
        {/* 가로(W) - 상단 변 중앙 */}
        <Text
          position={[cx, 0.02, cz - d / 2 - 0.15]}
          fontSize={LABEL_SIZE}
          color="#2563eb"
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {component.dimensions.width}mm
        </Text>

        {/* 세로(D) - 우측 변 중앙 */}
        <Text
          position={[cx + w / 2 + 0.15, 0.02, cz]}
          fontSize={LABEL_SIZE}
          color="#2563eb"
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        >
          {component.dimensions.depth}mm
        </Text>

        {/* 프리셋 타입 표시 */}
        {component.presetType && (
          <Text
            position={[cx, 0.02, cz]}
            fontSize={LABEL_SIZE}
            color="#10b981"
            anchorX="center"
            anchorY="middle"
            rotation={[-Math.PI / 2, 0, 0]}
          >
            {component.presetType}타입
          </Text>
        )}
      </group>
    );
  }

  // 입면도/3D: 가로, 높이, 부품 위치 표시
  return (
    <group position={[cx, h / 2, cz]}>
      {/* 가로(W) - 하단 */}
      <Text
        position={[0, -h / 2 - 0.15, d / 2 + 0.05]}
        fontSize={LABEL_SIZE}
        color="#2563eb"
        anchorX="center"
        anchorY="middle"
      >
        {component.dimensions.width}mm
      </Text>

      {/* 높이(H) - 우측 */}
      <Text
        position={[w / 2 + 0.15, 0, d / 2 + 0.05]}
        fontSize={LABEL_SIZE}
        color="#2563eb"
        anchorX="center"
        anchorY="middle"
        rotation={[0, 0, Math.PI / 2]}
      >
        H: {component.dimensions.height}mm
      </Text>

      {/* 프리셋 타입 표시 */}
      {component.presetType && (
        <Text
          position={[0, h / 2 + 0.15, d / 2 + 0.05]}
          fontSize={LABEL_SIZE}
          color="#10b981"
          anchorX="center"
          anchorY="middle"
        >
          {component.presetType}타입
        </Text>
      )}

      {/* 부품 위치 표시 */}
      {component.parts &&
        component.parts.map((part) => (
          <Text
            key={part.id}
            position={[-w / 2 - 0.2, part.y / 100 - h / 2, d / 2 + 0.05]}
            fontSize={PART_LABEL_SIZE}
            color="#4a90d9"
            anchorX="right"
            anchorY="middle"
          >
            {part.type === 'rod' ? '봉' : '선반'} {part.y}mm
          </Text>
        ))}
    </group>
  );
}
