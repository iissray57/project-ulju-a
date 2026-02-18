'use client';

import { useRef, useCallback } from 'react';
import { Rect, Text, Group, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { FloorObject, Point } from '../types';
import { MM_TO_PX, snapToGridValue, isRectInPolygon } from '../types';

interface FloorObjectLayerProps {
  obj: FloorObject;
  isSelected: boolean;
  zoom: number;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (width: number, depth: number) => void;
  onRotate: () => void;
  roomVertices: Point[];
  snapToGrid: boolean;
  gridSize: number;
}

export function FloorObjectLayer({
  obj,
  isSelected,
  zoom,
  onSelect,
  onDragEnd,
  onTransformEnd,
  onRotate,
  roomVertices,
  snapToGrid,
  gridSize,
}: FloorObjectLayerProps) {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const prevPosRef = useRef<{ x: number; y: number }>({ x: obj.x, y: obj.y });

  // Attach transformer to group when selected
  const attachTransformer = useCallback((node: Konva.Group | null) => {
    groupRef.current = node;
    if (node && isSelected && transformerRef.current) {
      transformerRef.current.nodes([node]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const xPx = obj.x * MM_TO_PX;
  const yPx = obj.y * MM_TO_PX;
  const wPx = obj.width * MM_TO_PX;
  const dPx = obj.depth * MM_TO_PX;

  const handleDragStart = () => {
    prevPosRef.current = { x: obj.x, y: obj.y };
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    // Convert px back to mm
    let xMm = node.x() / MM_TO_PX;
    let yMm = node.y() / MM_TO_PX;

    if (snapToGrid) {
      xMm = snapToGridValue(xMm, gridSize);
      yMm = snapToGridValue(yMm, gridSize);
    }

    // Check room boundary
    const fits = isRectInPolygon(xMm, yMm, obj.width, obj.depth, obj.rotation, roomVertices);
    if (!fits) {
      // Revert to previous position
      node.x(prevPosRef.current.x * MM_TO_PX);
      node.y(prevPosRef.current.y * MM_TO_PX);
      node.getLayer()?.batchDraw();
      return;
    }

    onDragEnd(xMm, yMm);
  };

  const handleTransformEnd = () => {
    const node = groupRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    // Reset scale, apply to width/depth
    const newWidthMm = Math.round((obj.width * scaleX) / gridSize) * gridSize;
    const newDepthMm = Math.round((obj.depth * scaleY) / gridSize) * gridSize;
    node.scaleX(1);
    node.scaleY(1);
    onTransformEnd(Math.max(gridSize, newWidthMm), Math.max(gridSize, newDepthMm));
  };

  const handleDblClick = () => {
    onRotate();
  };

  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const fillColor = hexToRgba(obj.color, 0.7);
  const labelFontSize = Math.max(10, 12 / zoom);

  return (
    <>
      <Group
        ref={attachTransformer}
        x={xPx}
        y={yPx}
        rotation={obj.rotation}
        draggable={!obj.locked}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      >
        <Rect
          width={wPx}
          height={dPx}
          fill={fillColor}
          stroke={isSelected ? '#2563EB' : obj.color}
          strokeWidth={isSelected ? 2 : 1}
          cornerRadius={2}
        />
        <Text
          width={wPx}
          height={dPx}
          text={obj.name}
          fontSize={labelFontSize}
          fill="#333333"
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      </Group>

      {isSelected && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            // Minimum size: gridSize mm
            const minPx = gridSize * MM_TO_PX;
            if (newBox.width < minPx || newBox.height < minPx) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}
