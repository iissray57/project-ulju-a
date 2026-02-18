'use client';

import {
  Undo2,
  Redo2,
  Grid3X3,
  Ruler,
  LocateFixed,
  Plus,
  Minus,
  Settings,
  Download,
} from 'lucide-react';
import { useFloorPlan } from '../floor-plan-context';

interface ToolbarProps {
  onExportPng?: () => void;
}

interface ToolButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolButton({ onClick, active, disabled, title, children }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={[
        'inline-flex items-center justify-center w-8 h-8 rounded-md text-sm transition-colors',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        active
          ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
          : 'text-gray-600 hover:bg-gray-100',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export function Toolbar({ onExportPng }: ToolbarProps) {
  const {
    state,
    canUndo,
    canRedo,
    undo,
    redo,
    setZoom,
    toggleGrid,
    toggleMeasurements,
    toggleSnapGrid,
    setRoomSetupOpen,
  } = useFloorPlan();

  const zoomPct = Math.round(state.zoom * 100);

  return (
    <div className="flex items-center h-12 border-b border-gray-200 bg-white px-3 gap-2 flex-shrink-0">
      {/* 좌측: 타이틀 */}
      <div className="w-[260px] flex-shrink-0">
        <span className="text-sm font-semibold text-gray-800">드레스룸 디자이너</span>
      </div>

      {/* 중앙: 도구 버튼들 */}
      <div className="flex items-center gap-1 flex-1 justify-center">
        {/* Undo / Redo */}
        <ToolButton onClick={undo} disabled={!canUndo} title="실행 취소">
          <Undo2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={redo} disabled={!canRedo} title="다시 실행">
          <Redo2 className="w-4 h-4" />
        </ToolButton>

        {/* 구분선 */}
        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* 그리드 토글 */}
        <ToolButton onClick={toggleGrid} active={state.showGrid} title="그리드 표시">
          <Grid3X3 className="w-4 h-4" />
        </ToolButton>

        {/* 치수 표시 토글 */}
        <ToolButton onClick={toggleMeasurements} active={state.showMeasurements} title="치수 표시">
          <Ruler className="w-4 h-4" />
        </ToolButton>

        {/* 스냅 토글 */}
        <ToolButton onClick={toggleSnapGrid} active={state.snapToGrid} title="그리드 스냅">
          <LocateFixed className="w-4 h-4" />
        </ToolButton>
      </div>

      {/* 우측: 줌 + 액션 */}
      <div className="flex items-center gap-1">
        <ToolButton
          onClick={() => setZoom(state.zoom - 0.1)}
          disabled={state.zoom <= 0.3}
          title="줌 아웃"
        >
          <Minus className="w-4 h-4" />
        </ToolButton>
        <span className="text-xs font-mono text-gray-600 w-10 text-center select-none">
          {zoomPct}%
        </span>
        <ToolButton
          onClick={() => setZoom(state.zoom + 0.1)}
          disabled={state.zoom >= 3}
          title="줌 인"
        >
          <Plus className="w-4 h-4" />
        </ToolButton>

        {/* 구분선 */}
        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* 방 크기 재설정 */}
        <ToolButton onClick={() => setRoomSetupOpen(true)} title="방 크기 재설정">
          <Settings className="w-4 h-4" />
        </ToolButton>

        {/* PNG 내보내기 */}
        <ToolButton onClick={() => onExportPng?.()} title="PNG 내보내기">
          <Download className="w-4 h-4" />
        </ToolButton>
      </div>
    </div>
  );
}
