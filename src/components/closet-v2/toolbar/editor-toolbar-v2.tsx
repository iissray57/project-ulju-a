'use client';

import {
  Grid3X3,
  Ruler,
  Magnet,
  Undo2,
  Redo2,
  Download,
  LayoutGrid,
  Rows3,
  Box,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { useEditorV2 } from '../editor-context-v2';
import type { ViewMode } from '@/lib/types/closet-editor';

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function ToolbarButton({ icon, label, active, onClick, disabled }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700'
          : disabled
          ? 'cursor-not-allowed text-slate-300'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

interface EditorToolbarV2Props {
  onExport: () => void;
  onSync?: () => void;
  syncing?: boolean;
}

export function EditorToolbarV2({ onExport, onSync, syncing }: EditorToolbarV2Props) {
  const { state, dispatch } = useEditorV2();
  const { viewMode, showGrid, showDimensions, snapEnabled, zoom, historyIndex, history } = state;

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleViewModeChange = (mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  };

  const handleZoomIn = () => {
    dispatch({ type: 'SET_ZOOM', payload: zoom * 1.2 });
  };

  const handleZoomOut = () => {
    dispatch({ type: 'SET_ZOOM', payload: zoom / 1.2 });
  };

  const handleResetZoom = () => {
    dispatch({ type: 'SET_ZOOM', payload: 1 });
    dispatch({ type: 'SET_PAN_OFFSET', payload: { x: 50, y: 50 } });
  };

  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
      {/* Left: View mode */}
      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
        <button
          onClick={() => handleViewModeChange('plan')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            viewMode === 'plan'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <LayoutGrid size={14} />
          평면도
        </button>
        <button
          onClick={() => handleViewModeChange('elevation')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            viewMode === 'elevation'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Rows3 size={14} />
          입면도
        </button>
        <button
          onClick={() => handleViewModeChange('3d')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            viewMode === '3d'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Box size={14} />
          3D
        </button>
      </div>

      {/* Center: Tools */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<Grid3X3 size={14} />}
          label="그리드"
          active={showGrid}
          onClick={() => dispatch({ type: 'SET_SHOW_GRID', payload: !showGrid })}
        />
        <ToolbarButton
          icon={<Ruler size={14} />}
          label="치수"
          active={showDimensions}
          onClick={() => dispatch({ type: 'SET_SHOW_DIMENSIONS', payload: !showDimensions })}
        />
        <ToolbarButton
          icon={<Magnet size={14} />}
          label="스냅"
          active={snapEnabled}
          onClick={() => dispatch({ type: 'SET_SNAP', payload: !snapEnabled })}
        />

        <div className="mx-2 h-6 w-px bg-slate-200" />

        <ToolbarButton
          icon={<Undo2 size={14} />}
          label="실행취소"
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={!canUndo}
        />
        <ToolbarButton
          icon={<Redo2 size={14} />}
          label="다시실행"
          onClick={() => dispatch({ type: 'REDO' })}
          disabled={!canRedo}
        />
      </div>

      {/* Right: Zoom & Export */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<ZoomOut size={14} />}
          label=""
          onClick={handleZoomOut}
        />
        <span className="w-12 text-center text-xs text-slate-500">
          {Math.round(zoom * 100)}%
        </span>
        <ToolbarButton
          icon={<ZoomIn size={14} />}
          label=""
          onClick={handleZoomIn}
        />
        <ToolbarButton
          icon={<RotateCcw size={14} />}
          label=""
          onClick={handleResetZoom}
        />

        <div className="mx-2 h-6 w-px bg-slate-200" />

        <button
          onClick={onExport}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Download size={14} />
          PNG
        </button>

        {onSync && (
          <button
            onClick={onSync}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? '동기화 중...' : '견적 동기화'}
          </button>
        )}
      </div>
    </div>
  );
}
