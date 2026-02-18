'use client';

import { useRef, useCallback } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { useFloorPlan } from '../floor-plan-context';
import { MM_TO_PX, snapToGridValue, isRectInPolygon } from '../types';
import { OBJECT_CATALOG } from '../data/object-catalog';
import { GridLayer } from './grid-layer';
import { RoomBoundaryLayer } from './room-boundary';
import { FloorObjectLayer } from './floor-object';

interface KonvaStageProps {
  width: number;
  height: number;
}

export default function KonvaStage({ width, height }: KonvaStageProps) {
  const { state, setZoom, setPan, addObject, selectObject, updateObject } = useFloorPlan();
  const {
    room,
    objects,
    selectedObjectId,
    activeTool,
    placingObjectType,
    zoom,
    panOffset,
    showGrid,
    showMeasurements,
    gridSize,
    snapToGrid,
  } = state;

  const stageRef = useRef<Konva.Stage>(null);
  const isSpaceDownRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  // Space key for pan mode
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.code === 'Space') {
      isSpaceDownRef.current = true;
      e.preventDefault();
    }
  }, []);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (e.code === 'Space') {
      isSpaceDownRef.current = false;
    }
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const scaleBy = 1.05;
      const oldZoom = zoom;
      const newZoom = e.evt.deltaY < 0
        ? Math.min(3, oldZoom * scaleBy)
        : Math.max(0.3, oldZoom / scaleBy);

      // Zoom toward pointer
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - panOffset.x) / oldZoom,
        y: (pointer.y - panOffset.y) / oldZoom,
      };

      const newPanX = pointer.x - mousePointTo.x * newZoom;
      const newPanY = pointer.y - mousePointTo.y * newZoom;

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    },
    [zoom, panOffset, setZoom, setPan],
  );

  // Mouse down - start panning (middle button or space+left)
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const isMiddle = e.evt.button === 1;
      const isSpacePan = isSpaceDownRef.current && e.evt.button === 0;
      if (isMiddle || isSpacePan) {
        isPanningRef.current = true;
        lastPointerRef.current = { x: e.evt.clientX, y: e.evt.clientY };
        e.evt.preventDefault();
      }
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isPanningRef.current || !lastPointerRef.current) return;
      const dx = e.evt.clientX - lastPointerRef.current.x;
      const dy = e.evt.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.evt.clientX, y: e.evt.clientY };
      setPan({ x: panOffset.x + dx, y: panOffset.y + dy });
    },
    [panOffset, setPan],
  );

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;
    lastPointerRef.current = null;
  }, []);

  // Stage click - place object or deselect
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isPanningRef.current) return;
      const stage = stageRef.current;
      if (!stage) return;

      // Deselect if clicking on stage background
      if (e.target === stage) {
        if (activeTool === 'select') {
          selectObject(null);
          return;
        }
      }

      if (activeTool === 'place' && placingObjectType && room) {
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        // Convert pointer to world coordinates (mm)
        const worldX = (pointer.x - panOffset.x) / zoom / MM_TO_PX;
        const worldY = (pointer.y - panOffset.y) / zoom / MM_TO_PX;

        const catalog = OBJECT_CATALOG[placingObjectType];
        let xMm = worldX - catalog.defaultWidth / 2;
        let yMm = worldY - catalog.defaultDepth / 2;

        if (snapToGrid) {
          xMm = snapToGridValue(xMm, gridSize);
          yMm = snapToGridValue(yMm, gridSize);
        }

        // Check fits in room
        const fits = isRectInPolygon(
          xMm, yMm, catalog.defaultWidth, catalog.defaultDepth, 0, room.vertices
        );
        if (!fits) return;

        addObject(placingObjectType, xMm, yMm);
      }
    },
    [activeTool, placingObjectType, room, panOffset, zoom, snapToGrid, gridSize, addObject, selectObject],
  );

  // Compute room bounding box for grid
  const roomBounds = room
    ? {
        width: Math.max(...room.vertices.map((v) => v.x)) - Math.min(...room.vertices.map((v) => v.x)),
        depth: Math.max(...room.vertices.map((v) => v.y)) - Math.min(...room.vertices.map((v) => v.y)),
        offsetX: Math.min(...room.vertices.map((v) => v.x)),
        offsetY: Math.min(...room.vertices.map((v) => v.y)),
      }
    : null;

  return (
    <div
      style={{ width, height, background: '#F5F5F5', overflow: 'hidden' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={zoom}
        scaleY={zoom}
        x={panOffset.x}
        y={panOffset.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleStageClick}
        style={{ cursor: isSpaceDownRef.current ? 'grab' : activeTool === 'place' ? 'crosshair' : 'default' }}
      >
        <Layer>
          {/* Grid */}
          {room && roomBounds && (
            <GridLayer
              showGrid={showGrid}
              gridSize={gridSize}
              roomWidth={roomBounds.width}
              roomDepth={roomBounds.depth}
            />
          )}

          {/* Room boundary */}
          {room && (
            <RoomBoundaryLayer
              boundary={room}
              showMeasurements={showMeasurements}
            />
          )}

          {/* Floor objects */}
          {objects.map((obj) => (
            <FloorObjectLayer
              key={obj.id}
              obj={obj}
              isSelected={selectedObjectId === obj.id}
              zoom={zoom}
              onSelect={() => selectObject(obj.id)}
              onDragEnd={(x, y) => updateObject(obj.id, { x, y })}
              onTransformEnd={(w, d) => updateObject(obj.id, { width: w, depth: d })}
              onRotate={() =>
                updateObject(obj.id, { rotation: (obj.rotation + 90) % 360 })
              }
              roomVertices={room?.vertices ?? []}
              snapToGrid={snapToGrid}
              gridSize={gridSize}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
