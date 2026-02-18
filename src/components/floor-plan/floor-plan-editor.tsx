'use client';

import dynamic from 'next/dynamic';
import { FloorPlanProvider, useFloorPlan } from './floor-plan-context';
import { ObjectPalette } from './panels/object-palette';
import { PropertyPanel } from './panels/property-panel';
import { Toolbar } from './panels/toolbar';
import { RoomSetupDialog } from './panels/room-setup-dialog';

const FloorPlanCanvas = dynamic(
  () => import('./canvas/floor-plan-canvas').then((m) => ({ default: m.FloorPlanCanvas })),
  { ssr: false, loading: () => <div className="flex-1 bg-gray-100 animate-pulse" /> },
);

interface FloorPlanEditorProps {
  orderId?: string | null;
  modelId?: string | null;
}

function EditorContent() {
  const { state } = useFloorPlan();

  return (
    <div className="flex flex-col bg-white" style={{ height: 'calc(100dvh - 3.5rem)' }}>
      {/* 상단 툴바 */}
      <Toolbar />

      {/* 본문 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 사이드바 */}
        <div className="w-[260px] flex-shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden">
          <ObjectPalette />
          <PropertyPanel />
        </div>

        {/* 캔버스 영역 */}
        <div className="flex-1 relative overflow-hidden bg-gray-50">
          <FloorPlanCanvas />
        </div>
      </div>

      {/* 방 설정 다이얼로그 */}
      {state.roomSetupOpen && <RoomSetupDialog />}
    </div>
  );
}

export function FloorPlanEditor({ orderId, modelId }: FloorPlanEditorProps) {
  return (
    <div className="-m-4 md:-m-6">
      <FloorPlanProvider orderId={orderId} modelId={modelId}>
        <EditorContent />
      </FloorPlanProvider>
    </div>
  );
}
