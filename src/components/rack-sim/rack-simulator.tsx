'use client';

import { lazy, Suspense, useState, useCallback, useEffect } from 'react';
import { Pin } from 'lucide-react';
import { toast } from 'sonner';
import { RackSimProvider, useRackSim } from './rack-context';
import type { RackItem } from './types';
import { ProductPanel } from './panels/product-panel';
import { ToolbarPanel } from './panels/toolbar-panel';
import { ItemTags } from './overlays/item-tags';
import { OperationOverlay } from './overlays/operation-overlay';
import { DetailOverlay } from './overlays/detail-overlay';
import {
  syncModelCaptures,
  createClosetModel,
  updateClosetModel,
  type ModelData,
} from '@/app/(dashboard)/closet/model-actions';

// Lazy load the 3D scene to reduce initial bundle
const RackScene = lazy(() =>
  import('./canvas/rack-scene').then((mod) => ({ default: mod.RackScene }))
);

function SimulatorContent() {
  const { state, dispatch } = useRackSim();
  const [syncing, setSyncing] = useState(false);
  const [pinned, setPinned] = useState(false);

  // Load existing model on mount if modelId is provided
  useEffect(() => {
    if (!state.modelId) return;
    const modelId = state.modelId;
    (async () => {
      const { getClosetModel } = await import('@/app/(dashboard)/closet/model-actions');
      const result = await getClosetModel(modelId);
      if (result.success && result.data) {
        const data = result.data.model_data as { rackItems?: unknown[] };
        if (data.rackItems && Array.isArray(data.rackItems)) {
          dispatch({ type: 'LOAD_STATE', payload: data.rackItems as RackItem[] });
        }
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = useCallback(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `rack-model-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  const handleSync = useCallback(async () => {
    if (!state.orderId) {
      toast.error('주문 정보가 없습니다. 주문 상세에서 에디터를 열어주세요.');
      return;
    }

    setSyncing(true);
    try {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) throw new Error('캔버스를 찾을 수 없습니다.');
      const planImage = canvas.toDataURL('image/png');
      const elevationImage = planImage;

      const modelData: ModelData = {
        components: [],
        gridSize: 50,
        version: 2,
        rackItems: state.items,
      };

      let modelId = state.modelId;
      if (!modelId) {
        const createResult = await createClosetModel({
          orderId: state.orderId,
          name: `앵글 모델 ${new Date().toLocaleDateString('ko-KR')}`,
          modelData,
        });
        if (!createResult.success || !createResult.data) {
          throw new Error(createResult.error || '모델 생성 실패');
        }
        modelId = createResult.data.id;
        dispatch({ type: 'SET_MODEL_ID', payload: modelId });
      } else {
        await updateClosetModel({ id: modelId, modelData });
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
  }, [state.orderId, state.modelId, state.items, dispatch]);

  // Undo/redo — currently wired to UNDO/REDO actions if reducer supports them
  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < (state.history?.length ?? 1) - 1;

  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  const handleRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, [dispatch]);

  return (
    <div
      className="-m-4 md:-m-6 -mb-20 lg:-mb-6 flex flex-col bg-[#1A1A1A]"
      style={{ height: 'calc(100dvh - 3.5rem)' }}
    >
      {/* Top nav bar */}
      <ToolbarPanel
        onExport={handleExport}
        onSync={state.orderId ? handleSync : undefined}
        onReset={handleReset}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        syncing={syncing}
      />

      {/* Main content: sidebar + canvas */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <ProductPanel />

        {/* Right main area: 3D canvas with overlays */}
        <div className="relative flex-1 overflow-hidden">
          {/* 3D Canvas */}
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center bg-[#1A1A1A]">
                <div className="text-sm text-slate-500">3D 뷰 로딩 중...</div>
              </div>
            }
          >
            <RackScene />
          </Suspense>

          {/* Overlay: item tags (top-left) */}
          <ItemTags />

          {/* Overlay: pin button (top-right) */}
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={() => setPinned((v) => !v)}
              title="상세 패널 고정"
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                pinned
                  ? 'border-orange-500/60 bg-orange-500/20 text-orange-400'
                  : 'border-[#444] bg-[#2A2A2A]/80 text-slate-400 hover:text-white hover:bg-[#333]/80'
              }`}
            >
              <Pin size={14} />
            </button>
          </div>

          {/* Overlay: operation buttons (bottom-center, selected only) */}
          <OperationOverlay />

          {/* Overlay: detail panel (right side, selected only or pinned) */}
          {(state.selectedItemId || pinned) && <DetailOverlay />}
        </div>
      </div>
    </div>
  );
}

interface RackSimulatorProps {
  orderId?: string | null;
  modelId?: string | null;
}

export function RackSimulator({ orderId, modelId }: RackSimulatorProps) {
  return (
    <RackSimProvider orderId={orderId} modelId={modelId}>
      <SimulatorContent />
    </RackSimProvider>
  );
}
