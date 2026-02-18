'use client';

import { Group, Line, Text, Rect } from 'react-konva';
import { useEditorV2 } from '../editor-context-v2';
import type { ClosetComponent } from '@/lib/types/closet-editor';

interface DimensionLabelProps {
  component: ClosetComponent;
}

export function DimensionLabel({ component }: DimensionLabelProps) {
  const { mmToPx, state } = useEditorV2();

  if (!state.showDimensions) return null;

  const { dimensions, position } = component;
  const x = mmToPx(position[0]);
  const z = mmToPx(position[2]);
  const widthPx = mmToPx(dimensions.width);
  const depthPx = mmToPx(dimensions.depth);

  const arrowSize = 4;
  const labelOffset = 12;

  return (
    <Group>
      {/* Width dimension (top) */}
      <Group x={x} y={z - labelOffset}>
        {/* Line */}
        <Line
          points={[0, 0, widthPx, 0]}
          stroke="#64748b"
          strokeWidth={1}
        />
        {/* Left arrow */}
        <Line
          points={[0, -arrowSize, 0, arrowSize]}
          stroke="#64748b"
          strokeWidth={1}
        />
        {/* Right arrow */}
        <Line
          points={[widthPx, -arrowSize, widthPx, arrowSize]}
          stroke="#64748b"
          strokeWidth={1}
        />
        {/* Label */}
        <Group x={widthPx / 2 - 20} y={-8}>
          <Rect
            width={40}
            height={14}
            fill="white"
            cornerRadius={2}
          />
          <Text
            x={0}
            y={1}
            width={40}
            text={`${dimensions.width}`}
            fontSize={10}
            fill="#374151"
            align="center"
          />
        </Group>
      </Group>

      {/* Depth dimension (left) */}
      <Group x={x - labelOffset} y={z}>
        {/* Line */}
        <Line
          points={[0, 0, 0, depthPx]}
          stroke="#64748b"
          strokeWidth={1}
        />
        {/* Top arrow */}
        <Line
          points={[-arrowSize, 0, arrowSize, 0]}
          stroke="#64748b"
          strokeWidth={1}
        />
        {/* Bottom arrow */}
        <Line
          points={[-arrowSize, depthPx, arrowSize, depthPx]}
          stroke="#64748b"
          strokeWidth={1}
        />
        {/* Label */}
        <Group x={-25} y={depthPx / 2 - 7}>
          <Rect
            width={30}
            height={14}
            fill="white"
            cornerRadius={2}
          />
          <Text
            x={0}
            y={1}
            width={30}
            text={`${dimensions.depth}`}
            fontSize={10}
            fill="#374151"
            align="center"
          />
        </Group>
      </Group>
    </Group>
  );
}

interface DimensionLabelsLayerProps {
  components: ClosetComponent[];
  selectedId: string | null;
}

export function DimensionLabelsLayer({ components, selectedId }: DimensionLabelsLayerProps) {
  return (
    <>
      {components
        .filter((c) => c.id === selectedId)
        .map((comp) => (
          <DimensionLabel key={`dim-${comp.id}`} component={comp} />
        ))}
    </>
  );
}
