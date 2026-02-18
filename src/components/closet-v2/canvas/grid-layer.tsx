'use client';

import { Group, Line, Rect, Text } from 'react-konva';
import { useEditorV2 } from '../editor-context-v2';
import { useMemo } from 'react';

export function GridLayer() {
  const { state, mmToPx } = useEditorV2();
  const { roomWidth, roomDepth, showGrid, gridSize, zoom } = state;

  const widthPx = mmToPx(roomWidth);
  const depthPx = mmToPx(roomDepth);

  // Memoize grid lines to re-calculate when gridSize changes
  const gridLines = useMemo(() => {
    if (!showGrid) return [];

    const lines: React.ReactNode[] = [];

    // Vertical lines
    for (let x = 0; x <= roomWidth; x += gridSize) {
      const xPx = x * 0.15 * zoom; // Use inline calculation for consistency
      const isMajor = x % (gridSize * 10) === 0;
      lines.push(
        <Line
          key={`v-${gridSize}-${x}`}
          points={[xPx, 0, xPx, depthPx]}
          stroke={isMajor ? '#cbd5e1' : '#e2e8f0'}
          strokeWidth={isMajor ? 1 : 0.5}
        />
      );
    }

    // Horizontal lines
    for (let z = 0; z <= roomDepth; z += gridSize) {
      const zPx = z * 0.15 * zoom;
      const isMajor = z % (gridSize * 10) === 0;
      lines.push(
        <Line
          key={`h-${gridSize}-${z}`}
          points={[0, zPx, widthPx, zPx]}
          stroke={isMajor ? '#cbd5e1' : '#e2e8f0'}
          strokeWidth={isMajor ? 1 : 0.5}
        />
      );
    }

    return lines;
  }, [roomWidth, roomDepth, gridSize, showGrid, widthPx, depthPx, zoom]);

  if (!showGrid) return null;

  return (
    <Group key={`grid-${gridSize}`}>
      {/* Background */}
      <Rect
        x={0}
        y={0}
        width={widthPx}
        height={depthPx}
        fill="#f8fafc"
        stroke="#94a3b8"
        strokeWidth={2}
      />
      {gridLines}
      {/* Origin label */}
      <Text
        x={-30}
        y={-20}
        text="0,0"
        fontSize={10}
        fill="#64748b"
      />
      {/* Grid size indicator */}
      <Text
        x={widthPx + 10}
        y={-20}
        text={`그리드: ${gridSize}mm`}
        fontSize={10}
        fill="#64748b"
      />
    </Group>
  );
}
