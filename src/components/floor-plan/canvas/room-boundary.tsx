'use client';

import { Line, Circle, Text } from 'react-konva';
import type { RoomBoundary } from '../types';
import { MM_TO_PX } from '../types';

interface RoomBoundaryLayerProps {
  boundary: RoomBoundary;
  showMeasurements: boolean;
}

export function RoomBoundaryLayer({ boundary, showMeasurements }: RoomBoundaryLayerProps) {
  const { walls, vertices } = boundary;

  return (
    <>
      {/* Walls */}
      {walls.map((wall) => {
        const strokeWidth = Math.max(3, wall.thickness * MM_TO_PX);
        const x1 = wall.start.x * MM_TO_PX;
        const y1 = wall.start.y * MM_TO_PX;
        const x2 = wall.end.x * MM_TO_PX;
        const y2 = wall.end.y * MM_TO_PX;

        return (
          <Line
            key={wall.id}
            points={[x1, y1, x2, y2]}
            stroke="#333333"
            strokeWidth={strokeWidth}
            lineCap="round"
            lineJoin="round"
            listening={false}
          />
        );
      })}

      {/* Measurements */}
      {showMeasurements &&
        walls.map((wall) => {
          const x1 = wall.start.x * MM_TO_PX;
          const y1 = wall.start.y * MM_TO_PX;
          const x2 = wall.end.x * MM_TO_PX;
          const y2 = wall.end.y * MM_TO_PX;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
          const lengthMm = Math.round(
            Math.sqrt(
              Math.pow(wall.end.x - wall.start.x, 2) +
                Math.pow(wall.end.y - wall.start.y, 2),
            ),
          );

          return (
            <Text
              key={`measure-${wall.id}`}
              x={midX}
              y={midY - 12}
              text={`${lengthMm}mm`}
              fontSize={10}
              fill="#555555"
              rotation={angle}
              offsetX={String(lengthMm).length * 3}
              align="center"
              listening={false}
            />
          );
        })}

      {/* Vertices */}
      {vertices.map((v, i) => (
        <Circle
          key={`vertex-${i}`}
          x={v.x * MM_TO_PX}
          y={v.y * MM_TO_PX}
          radius={4}
          fill="#333333"
          listening={false}
        />
      ))}
    </>
  );
}
