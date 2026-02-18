'use client';

import { useRef, useCallback, lazy, Suspense, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { EditorProviderV2, useEditorV2 } from './editor-context-v2';
import { KonvaCanvas } from './canvas/konva-canvas';
import { EditorToolbarV2 } from './toolbar/editor-toolbar-v2';
import { PresetPalette } from './palette/preset-palette';
import { PropertyPanel } from './palette/property-panel';
import { useHistory } from './hooks/use-history';
import type { ClosetPresetType, CornerType } from '@/lib/types/closet-editor';
import {
  syncModelCaptures,
  createClosetModel,
  updateClosetModel,
  type ModelData,
} from '@/app/(dashboard)/closet/model-actions';

// Lazy load Three.js view to reduce initial bundle
const ThreeView = lazy(() =>
  import('./canvas/three-view').then((mod) => ({ default: mod.ThreeView }))
);

function EditorContent() {
  const { addComponentFromPreset, addFurnitureFromPreset, state, dispatch } = useEditorV2();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [syncing, setSyncing] = useState(false);

  // Enable keyboard shortcuts for undo/redo/delete
  useHistory();

  // Load existing model on mount if modelId is provided
  useEffect(() => {
    if (!state.modelId) return;
    const modelId = state.modelId;
    (async () => {
      const { getClosetModel } = await import('@/app/(dashboard)/closet/model-actions');
      const result = await getClosetModel(modelId);
      if (result.success && result.data) {
        dispatch({ type: 'LOAD_STATE', payload: result.data.model_data.components });
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `closet-3d-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } else {
      const stage = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement;
      if (!stage) return;
      const dataUrl = stage.toDataURL();
      const link = document.createElement('a');
      link.download = `closet-design-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  }, [state.viewMode]);

  const handleSync = useCallback(async () => {
    if (!state.orderId) {
      toast.error('주문 정보가 없습니다. 주문 상세에서 에디터를 열어주세요.');
      return;
    }

    setSyncing(true);
    try {
      const originalViewMode = state.viewMode;

      const captureCanvas = (): string => {
        const canvas = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement;
        if (!canvas) throw new Error('캔버스를 찾을 수 없습니다.');
        return canvas.toDataURL('image/png');
      };

      dispatch({ type: 'SET_VIEW_MODE', payload: 'plan' });
      await new Promise(r => setTimeout(r, 300));
      const planImage = captureCanvas();

      dispatch({ type: 'SET_VIEW_MODE', payload: 'elevation' });
      await new Promise(r => setTimeout(r, 300));
      const elevationImage = captureCanvas();

      dispatch({ type: 'SET_VIEW_MODE', payload: originalViewMode });

      const modelData: ModelData = {
        components: state.components,
        gridSize: state.gridSize,
        version: 1,
      };

      let modelId = state.modelId;
      if (!modelId) {
        const createResult = await createClosetModel({
          orderId: state.orderId,
          name: `모델 ${new Date().toLocaleDateString('ko-KR')}`,
          modelData,
        });
        if (!createResult.success || !createResult.data) {
          throw new Error(createResult.error || '모델 생성 실패');
        }
        modelId = createResult.data.id;
        dispatch({ type: 'SET_MODEL_ID', payload: modelId });
      } else {
        await updateClosetModel({
          id: modelId,
          modelData,
        });
      }

      const syncResult = await syncModelCaptures({
        modelId,
        planImage,
        elevationImage,
      });

      if (!syncResult.success) {
        throw new Error(syncResult.error || '이미지 동기화 실패');
      }

      toast.success('견적 동기화 완료');
    } catch (err) {
      console.error('Sync failed:', err);
      toast.error(err instanceof Error ? err.message : '동기화 실패');
    } finally {
      setSyncing(false);
    }
  }, [state.orderId, state.modelId, state.viewMode, state.components, state.gridSize, dispatch]);

  const viewModeLabel =
    state.viewMode === 'plan' ? '평면도' : state.viewMode === 'elevation' ? '입면도' : '3D';

  return (
    <div className="-m-4 md:-m-6 -mb-20 lg:-mb-6 flex flex-col bg-slate-50" style={{ height: 'calc(100dvh - 3.5rem)' }}>
      {/* Toolbar */}
      <EditorToolbarV2
        onExport={handleExport}
        onSync={state.orderId ? handleSync : undefined}
        syncing={syncing}
      />

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

interface ClosetEditorV2Props {
  orderId?: string | null;
  modelId?: string | null;
}

export function ClosetEditorV2({ orderId, modelId }: ClosetEditorV2Props = {}) {
  return (
    <EditorProviderV2 orderId={orderId} modelId={modelId}>
      <EditorContent />
    </EditorProviderV2>
  );
}
