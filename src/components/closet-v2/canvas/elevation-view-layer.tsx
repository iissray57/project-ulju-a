'use client';

import { Group, Rect, Text, Line } from 'react-konva';
import { useEditorV2, PRESET_COLORS } from '../editor-context-v2';
import type { ClosetComponent } from '@/lib/types/closet-editor';

interface ElevationUnitProps {
  component: ClosetComponent;
  isSelected: boolean;
  offsetX: number;
  onSelect: () => void;
  onPartDragEnd: (partId: string, newY: number) => void;
}

function ElevationUnit({
  component,
  isSelected,
  offsetX,
  onSelect,
}: Omit<ElevationUnitProps, 'onPartDragEnd'>) {
  const { mmToPx } = useEditorV2();
  const { presetType, dimensions, parts = [] } = component;

  const widthPx = mmToPx(dimensions.width);
  const heightPx = mmToPx(dimensions.height);

  const colors = presetType ? PRESET_COLORS[presetType] : { bg: '#f1f5f9', border: '#64748b' };

  // 입면도에서 Y축은 위가 높은 값
  const convertY = (y: number) => heightPx - mmToPx(y);

  return (
    <Group x={offsetX} y={0} onClick={onSelect} onTap={onSelect}>
      {/* Frame */}
      <Rect
        width={widthPx}
        height={heightPx}
        fill={colors.bg}
        stroke={isSelected ? '#1d4ed8' : colors.border}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={4}
        shadowColor="rgba(0,0,0,0.1)"
        shadowBlur={8}
        shadowOffsetY={2}
      />

      {/* Type badge */}
      {presetType && (
        <Group x={widthPx / 2 - 15} y={8}>
          <Rect width={30} height={20} fill={colors.border} cornerRadius={4} />
          <Text
            x={0}
            y={4}
            width={30}
            text={presetType}
            fontSize={12}
            fontStyle="bold"
            fill="white"
            align="center"
          />
        </Group>
      )}

      {/* Parts */}
      {parts.map((part) => {
        const partY = convertY(part.y + part.height);
        const partHeightPx = mmToPx(part.height);

        if (part.type === 'shelf') {
          return (
            <Group key={part.id} y={partY}>
              <Rect
                x={10}
                y={0}
                width={widthPx - 20}
                height={partHeightPx}
                fill="#94a3b8"
                stroke="#64748b"
                strokeWidth={1}
                cornerRadius={2}
              />
              <Text
                x={widthPx / 2}
                y={partHeightPx + 4}
                text={`${part.y}mm`}
                fontSize={9}
                fill="#64748b"
                offsetX={15}
              />
            </Group>
          );
        }

        // Rod
        return (
          <Group key={part.id} y={partY + partHeightPx / 2}>
            <Line
              points={[20, 0, widthPx - 20, 0]}
              stroke="#3b82f6"
              strokeWidth={4}
              lineCap="round"
            />
            {/* Rod brackets */}
            <Rect x={12} y={-8} width={8} height={16} fill="#64748b" cornerRadius={2} />
            <Rect x={widthPx - 20} y={-8} width={8} height={16} fill="#64748b" cornerRadius={2} />
            <Text
              x={widthPx / 2}
              y={10}
              text={`${part.y}mm`}
              fontSize={9}
              fill="#64748b"
              offsetX={15}
            />
          </Group>
        );
      })}

      {/* Height label */}
      <Text
        x={widthPx + 8}
        y={heightPx / 2 - 6}
        text={`H:${dimensions.height}`}
        fontSize={10}
        fill="#64748b"
      />

      {/* Width label */}
      <Text
        x={0}
        y={heightPx + 8}
        width={widthPx}
        text={`W:${dimensions.width}`}
        fontSize={10}
        fill="#64748b"
        align="center"
      />
    </Group>
  );
}

export function ElevationViewLayer() {
  const { state, dispatch } = useEditorV2();
  const { components, selectedId, zoom } = state;

  // 입면도에서는 컴포넌트를 가로로 나열
  let offsetX = 50;
  const gap = 30;

  const handleSelect = (id: string) => {
    dispatch({ type: 'SELECT_COMPONENT', payload: id });
  };

  const handlePartDragEnd = (unitId: string, partId: string, newY: number) => {
    dispatch({
      type: 'UPDATE_PART',
      payload: { unitId, partId, updates: { y: newY } },
    });
  };

  return (
    <>
      {components.map((comp) => {
        const element = (
          <ElevationUnit
            key={comp.id}
            component={comp}
            isSelected={selectedId === comp.id}
            offsetX={offsetX}
            onSelect={() => handleSelect(comp.id)}
          />
        );
        offsetX += comp.dimensions.width * 0.15 * zoom + gap;
        return element;
      })}
    </>
  );
}
