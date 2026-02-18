'use client';

import { useRef, useCallback, lazy, Suspense } from 'react';
import { EditorProviderV2, useEditorV2 } from './editor-context-v2';
import { KonvaCanvas } from './canvas/konva-canvas';
import { EditorToolbarV2 } from './toolbar/editor-toolbar-v2';
import { PresetPalette } from './palette/preset-palette';
import { PropertyPanel } from './palette/property-panel';
import { useHistory } from './hooks/use-history';
import type { ClosetPresetType, CornerType } from '@/lib/types/closet-editor';

// Lazy load Three.js view to reduce initial bundle
const ThreeView = lazy(() =>
  import('./canvas/three-view').then((mod) => ({ default: mod.ThreeView }))
);

function EditorContent() {
  const { addComponentFromPreset, addFurnitureFromPreset, state } = useEditorV2();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Enable keyboard shortcuts for undo/redo/delete
  useHistory();

  const handleDrop = useCallback(
    (presetType: string, width: number, x: number, z: number, cornerType?: string) => {
      addComponentFromPreset(
        presetType as ClosetPresetType,
        width,
        x,
        z,
        cornerType as CornerType | undefined
      );
    },
    [addComponentFromPreset]
  );

  const handleFurnitureDrop = useCallback(
    (furniturePresetId: string, x: number, z: number) => {
      addFurnitureFromPreset(furniturePresetId, x, z);
    },
    [addFurnitureFromPreset]
  );

  const handleExport = useCallback(async () => {
    if (state.viewMode === '3d') {
      // Three.js canvas export
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `closet-3d-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } else {
      // Konva stage export
      const stage = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement;
      if (!stage) return;
      const dataUrl = stage.toDataURL();
      const link = document.createElement('a');
      link.download = `closet-design-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  }, [state.viewMode]);

  const viewModeLabel =
    state.viewMode === 'plan' ? '평면도' : state.viewMode === 'elevation' ? '입면도' : '3D';

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Toolbar */}
      <EditorToolbarV2 onExport={handleExport} />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Presets (hide in 3D mode) */}
        {state.viewMode !== '3d' && (
          <div className="w-56 flex-shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4">
            <PresetPalette />
          </div>
        )}

        {/* Canvas */}
        <div ref={canvasRef} className="flex-1">
          {state.viewMode === '3d' ? (
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center bg-slate-100">
                  <div className="text-sm text-slate-500">3D 뷰 로딩 중...</div>
                </div>
              }
            >
              <ThreeView />
            </Suspense>
          ) : (
            <KonvaCanvas onDrop={handleDrop} onFurnitureDrop={handleFurnitureDrop} />
          )}
        </div>

        {/* Right panel - Properties */}
        <div className="w-64 flex-shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4">
          <PropertyPanel />
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-500">
        <span>
          방 크기: {state.roomWidth} × {state.roomDepth} mm
        </span>
        <span>컴포넌트: {state.components.length}개</span>
        <span>
          {viewModeLabel} |{' '}
          {state.viewMode === '3d' ? '마우스로 회전' : `스냅: ${state.snapEnabled ? 'ON' : 'OFF'}`}
        </span>
      </div>
    </div>
  );
}

export function ClosetEditorV2() {
  return (
    <EditorProviderV2>
      <EditorContent />
    </EditorProviderV2>
  );
}
