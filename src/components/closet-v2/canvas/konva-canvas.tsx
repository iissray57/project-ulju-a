'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { useEditorV2 } from '../editor-context-v2';
import { GridLayer } from './grid-layer';
import { PlanViewLayer } from './plan-view-layer';
import { ElevationViewLayer } from './elevation-view-layer';

interface KonvaCanvasProps {
  onDrop?: (presetType: string, width: number, x: number, y: number, cornerType?: string) => void;
  onFurnitureDrop?: (furniturePresetId: string, x: number, y: number) => void;
}

export function KonvaCanvas({ onDrop, onFurnitureDrop }: KonvaCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const { state, dispatch, pxToMm } = useEditorV2();
  const { viewMode, panOffset, zoom } = state;

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Wheel zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const scaleBy = 1.1;
      const stage = stageRef.current;
      if (!stage) return;

      const oldZoom = zoom;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const newZoom = e.evt.deltaY < 0 ? oldZoom * scaleBy : oldZoom / scaleBy;
      dispatch({ type: 'SET_ZOOM', payload: newZoom });
    },
    [zoom, dispatch]
  );

  // Click on empty area to deselect
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (e.target === stageRef.current) {
        dispatch({ type: 'SELECT_COMPONENT', payload: null });
      }
    },
    [dispatch]
  );

  // Drag and drop from palette
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;

      try {
        const data = JSON.parse(dataStr);
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left - panOffset.x;
        const y = e.clientY - rect.top - panOffset.y;

        const mmX = pxToMm(x);
        const mmY = pxToMm(y);

        // 드레스룸 가구인 경우
        if (data.furniturePreset) {
          onFurnitureDrop?.(data.furniturePreset, mmX, mmY);
        } else {
          // 옷장 유닛인 경우
          onDrop?.(data.presetType, data.width, mmX, mmY, data.cornerType);
        }
      } catch {
        console.error('Failed to parse drop data');
      }
    },
    [panOffset, pxToMm, onDrop, onFurnitureDrop]
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-slate-100"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scaleX={zoom}
        scaleY={zoom}
        x={panOffset.x}
        y={panOffset.y}
        draggable
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            dispatch({
              type: 'SET_PAN_OFFSET',
              payload: { x: e.target.x(), y: e.target.y() },
            });
          }
        }}
      >
        {/* Grid Layer */}
        <Layer>
          {viewMode === 'plan' && <GridLayer />}
        </Layer>

        {/* Content Layer */}
        <Layer>
          {viewMode === 'plan' ? <PlanViewLayer /> : <ElevationViewLayer />}
        </Layer>
      </Stage>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
