'use client';

import { Line } from 'react-konva';
import { MM_TO_PX } from '../types';

interface GridLayerProps {
  showGrid: boolean;
  gridSize: number;    // mm
  roomWidth: number;   // mm
  roomDepth: number;   // mm
}

export function GridLayer({ showGrid, gridSize, roomWidth, roomDepth }: GridLayerProps) {
  if (!showGrid) return null;

  const widthPx = roomWidth * MM_TO_PX;
  const depthPx = roomDepth * MM_TO_PX;
  const stepPx = gridSize * MM_TO_PX;
  const majorStep = 500; // mm - major grid every 500mm

  const lines: React.ReactElement[] = [];

  // Vertical lines (x-axis steps)
  const colCount = Math.ceil(widthPx / stepPx);
  for (let i = 0; i <= colCount; i++) {
    const x = i * stepPx;
    const isMajor = Math.round(i * gridSize) % majorStep === 0;
    lines.push(
      <Line
        key={`v-${i}`}
        points={[x, 0, x, depthPx]}
        stroke={isMajor ? '#C0C0C0' : '#E0E0E0'}
        strokeWidth={isMajor ? 0.8 : 0.4}
        listening={false}
      />,
    );
  }

  // Horizontal lines (y-axis steps)
  const rowCount = Math.ceil(depthPx / stepPx);
  for (let j = 0; j <= rowCount; j++) {
    const y = j * stepPx;
    const isMajor = Math.round(j * gridSize) % majorStep === 0;
    lines.push(
      <Line
        key={`h-${j}`}
        points={[0, y, widthPx, y]}
        stroke={isMajor ? '#C0C0C0' : '#E0E0E0'}
        strokeWidth={isMajor ? 0.8 : 0.4}
        listening={false}
      />,
    );
  }

  return <>{lines}</>;
}
