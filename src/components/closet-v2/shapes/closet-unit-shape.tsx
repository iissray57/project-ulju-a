'use client';

import { Group, Rect, Text, Line, Shape } from 'react-konva';
import type Konva from 'konva';
import { useEditorV2, PRESET_COLORS } from '../editor-context-v2';
import type { ClosetComponent } from '@/lib/types/closet-editor';

// 코너 유닛: 벽과 닿지 않는 쪽 고정 깊이 (400mm)
const CORNER_LEG_DEPTH_MM = 400;

interface ClosetUnitShapeProps {
  component: ClosetComponent;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, z: number) => void;
}

export function ClosetUnitShape({
  component,
  isSelected,
  onSelect,
  onDragEnd,
}: ClosetUnitShapeProps) {
  const { mmToPx, pxToMm, snapToGrid, magneticSnap, state } = useEditorV2();
  const { presetType, cornerType, dimensions, position, rotation, locked, mirrored } = component;

  // Y축 회전 (라디안)
  const rotationY = rotation[1] || 0;
  const rotationDeg = (rotationY * 180) / Math.PI;

  const widthPx = mmToPx(dimensions.width);
  const depthPx = mmToPx(dimensions.depth);
  const xPx = mmToPx(position[0]);
  const zPx = mmToPx(position[2]);

  const colors = presetType ? PRESET_COLORS[presetType] : { bg: '#f1f5f9', border: '#64748b' };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    // Group의 x/y는 center 기준이므로, 좌상단 기준으로 변환
    const rawX = pxToMm(node.x()) - dimensions.width / 2;
    const rawZ = pxToMm(node.y()) - dimensions.depth / 2;

    // 마그네틱 스냅 적용
    const snapResult = magneticSnap(component.id, rawX, rawZ, dimensions.width, dimensions.depth);

    // 그리드 스냅은 마그네틱 스냅이 없을 때만 적용
    const hasMagneticSnap = snapResult.snappedToComponent || Object.values(snapResult.snappedToWall).some(v => v);
    const finalX = hasMagneticSnap ? snapResult.x : snapToGrid(snapResult.x);
    const finalZ = hasMagneticSnap ? snapResult.z : snapToGrid(snapResult.z);

    // 경계 제한
    const clampedX = Math.max(0, Math.min(finalX, state.roomWidth - dimensions.width));
    const clampedZ = Math.max(0, Math.min(finalZ, state.roomDepth - dimensions.depth));

    // center 기준으로 다시 변환하여 설정
    node.x(mmToPx(clampedX) + widthPx / 2);
    node.y(mmToPx(clampedZ) + depthPx / 2);

    onDragEnd(clampedX, clampedZ);
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    // Group의 x/y는 center 기준이므로, 좌상단 기준으로 변환
    const rawX = pxToMm(node.x()) - dimensions.width / 2;
    const rawZ = pxToMm(node.y()) - dimensions.depth / 2;

    // 마그네틱 스냅 실시간 적용 (드래그 중)
    const snapResult = magneticSnap(component.id, rawX, rawZ, dimensions.width, dimensions.depth);

    // 마그네틱 스냅이 있으면 그 위치로, 없으면 그리드 스냅
    const hasMagneticSnap = snapResult.snappedToComponent || Object.values(snapResult.snappedToWall).some(v => v);
    const finalX = hasMagneticSnap ? snapResult.x : snapToGrid(rawX);
    const finalZ = hasMagneticSnap ? snapResult.z : snapToGrid(rawZ);

    // center 기준으로 다시 변환하여 설정
    node.x(mmToPx(finalX) + widthPx / 2);
    node.y(mmToPx(finalZ) + depthPx / 2);
  };

  // 코너 Shape 그리기 - 하나의 매끄러운 L자 도형
  // 벽과 닿는 쪽 = 가변 (width, depth)
  // 벽과 안 닿는 쪽 = 400mm 고정
  const renderCornerShape = () => {
    const legDepthPx = mmToPx(CORNER_LEG_DEPTH_MM); // 벽과 안 닿는 쪽 깊이 (고정 400mm)
    const isL = cornerType === 'L';
    const flip = mirrored;

    // L자 폴리곤 그리기 (하나의 Shape로 매끄럽게)
    return (
      <Shape
        sceneFunc={(context, shape) => {
          context.beginPath();

          if (isL) {
            // ㄱ자: 상단-좌측 코너
            // 벽: 상단 (width 길이) + 좌측 (depth 길이)
            // 폭: 400mm 고정
            if (!flip) {
              // 좌상단 코너 (0,0 기준)
              context.moveTo(0, 0);
              context.lineTo(widthPx, 0);                    // 상단 벽 따라
              context.lineTo(widthPx, legDepthPx);           // 오른쪽 아래로
              context.lineTo(legDepthPx, legDepthPx);        // 왼쪽으로 (안쪽 코너)
              context.lineTo(legDepthPx, depthPx);           // 아래로
              context.lineTo(0, depthPx);                    // 왼쪽으로
              context.closePath();
            } else {
              // 우상단 코너 (반전)
              context.moveTo(0, 0);
              context.lineTo(widthPx, 0);                    // 상단 벽 따라
              context.lineTo(widthPx, depthPx);              // 오른쪽 벽 따라
              context.lineTo(widthPx - legDepthPx, depthPx); // 왼쪽으로
              context.lineTo(widthPx - legDepthPx, legDepthPx); // 위로 (안쪽 코너)
              context.lineTo(0, legDepthPx);                 // 왼쪽으로
              context.closePath();
            }
          } else {
            // ㄴ자: 하단-좌측 코너
            if (!flip) {
              // 좌하단 코너
              context.moveTo(0, 0);
              context.lineTo(legDepthPx, 0);                 // 오른쪽으로
              context.lineTo(legDepthPx, depthPx - legDepthPx); // 아래로 (안쪽 코너)
              context.lineTo(widthPx, depthPx - legDepthPx); // 오른쪽으로
              context.lineTo(widthPx, depthPx);              // 아래로
              context.lineTo(0, depthPx);                    // 왼쪽 벽 따라
              context.closePath();
            } else {
              // 우하단 코너 (반전)
              context.moveTo(widthPx - legDepthPx, 0);
              context.lineTo(widthPx, 0);                    // 오른쪽으로
              context.lineTo(widthPx, depthPx);              // 오른쪽 벽 따라
              context.lineTo(0, depthPx);                    // 하단 벽 따라
              context.lineTo(0, depthPx - legDepthPx);       // 위로
              context.lineTo(widthPx - legDepthPx, depthPx - legDepthPx); // 오른쪽 (안쪽 코너)
              context.closePath();
            }
          }

          context.fillStrokeShape(shape);
        }}
        fill={colors.bg}
        stroke={isSelected ? '#1d4ed8' : colors.border}
        strokeWidth={isSelected ? 2 : 1}
        shadowColor="rgba(0,0,0,0.15)"
        shadowBlur={isSelected ? 12 : 6}
        shadowOffsetY={2}
      />
    );
  };

  // 일반 사각형 (반전 시 scaleX=-1)
  const renderRectShape = () => (
    <Group scaleX={mirrored ? -1 : 1} offsetX={mirrored ? widthPx : 0}>
      <Rect
        width={widthPx}
        height={depthPx}
        fill={colors.bg}
        stroke={isSelected ? '#1d4ed8' : colors.border}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={4}
        shadowColor="rgba(0,0,0,0.15)"
        shadowBlur={isSelected ? 12 : 6}
        shadowOffsetY={2}
      />
    </Group>
  );

  return (
    <Group
      x={xPx + widthPx / 2}
      y={zPx + depthPx / 2}
      offsetX={widthPx / 2}
      offsetY={depthPx / 2}
      rotation={rotationDeg}
      draggable={!locked}
      onDragEnd={handleDragEnd}
      onDragMove={handleDragMove}
      onClick={onSelect}
      onTap={onSelect}
    >
      {/* Shape */}
      {cornerType ? renderCornerShape() : renderRectShape()}

      {/* Type badge */}
      {presetType && (
        <Group x={6} y={6}>
          <Rect width={cornerType ? 36 : 24} height={18} fill={colors.border} cornerRadius={4} />
          <Text
            x={0}
            y={2}
            width={cornerType ? 36 : 24}
            text={cornerType ? `${presetType}${cornerType}` : presetType}
            fontSize={10}
            fontStyle="bold"
            fill="white"
            align="center"
          />
        </Group>
      )}

      {/* Mirror indicator */}
      {mirrored && !cornerType && (
        <Group x={widthPx - 20} y={6}>
          <Rect width={14} height={14} fill="#3b82f6" cornerRadius={3} />
          <Text x={0} y={1} width={14} text="⟷" fontSize={10} fill="white" align="center" />
        </Group>
      )}

      {/* Dimensions label */}
      <Text
        x={0}
        y={depthPx / 2 - 6}
        width={widthPx}
        text={`${dimensions.width}×${dimensions.depth}`}
        fontSize={10}
        fill="#374151"
        align="center"
      />

      {/* Internal parts preview */}
      {!cornerType &&
        component.parts?.map((part) => {
          const partY = mmToPx(part.y) * (depthPx / mmToPx(dimensions.height));
          return (
            <Line
              key={part.id}
              points={[4, depthPx - partY * 0.1, widthPx - 4, depthPx - partY * 0.1]}
              stroke={part.type === 'rod' ? '#3b82f6' : '#6b7280'}
              strokeWidth={part.type === 'rod' ? 2 : 1}
              dash={part.type === 'shelf' ? [4, 2] : undefined}
            />
          );
        })}

      {/* Selection indicator */}
      {isSelected && (
        <>
          {[
            [0, 0],
            [widthPx, 0],
            [0, depthPx],
            [widthPx, depthPx],
          ].map(([hx, hy], i) => (
            <Rect
              key={i}
              x={hx - 4}
              y={hy - 4}
              width={8}
              height={8}
              fill="white"
              stroke="#1d4ed8"
              strokeWidth={1}
              cornerRadius={2}
            />
          ))}
        </>
      )}
    </Group>
  );
}
