'use client';

import { Undo2, Redo2, RefreshCw, ImageIcon, RotateCcw } from 'lucide-react';
import { useRackSim } from '../rack-context';
import { VIRTUAL_BACKGROUNDS, type VirtualBackground } from '../types';

const BACKGROUND_KEYS = Object.keys(VIRTUAL_BACKGROUNDS) as VirtualBackground[];

export interface ToolbarPanelProps {
  onExport: () => void;
  onSync?: () => void;
  onReset?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  syncing?: boolean;
}

export function ToolbarPanel({
  onExport,
  onSync,
  onReset,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  syncing = false,
}: ToolbarPanelProps) {
  const { state, dispatch } = useRackSim();

  const setBackground = (bg: VirtualBackground) => {
    dispatch({ type: 'SET_BACKGROUND', payload: bg });
  };

  return (
    <div className="flex h-12 items-center bg-[#1A1A1A] border-b border-[#333] shrink-0">
      {/* Logo area - same width as sidebar */}
      <div className="flex h-full w-[260px] items-center px-4 border-r border-[#333] shrink-0">
        <span className="text-sm font-bold text-orange-500 tracking-wide">울주앵글</span>
        <span className="ml-2 text-[10px] text-slate-500 font-medium">앵글 모델러</span>
      </div>

      {/* Undo / Redo */}
      <div className="flex items-center gap-1 px-3">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="실행 취소"
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-[#333] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Undo2 size={15} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="다시 실행"
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-[#333] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Redo2 size={15} />
        </button>
      </div>

      {/* Background selector */}
      <div className="flex items-center gap-1 px-2 border-l border-[#333]">
        {BACKGROUND_KEYS.map((bg) => {
          const info = VIRTUAL_BACKGROUNDS[bg];
          const isActive = state.background === bg;
          return (
            <button
              key={bg}
              onClick={() => setBackground(bg)}
              title={info.name}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : 'text-slate-500 hover:bg-[#333] hover:text-slate-300'
              }`}
            >
              <span className="text-sm leading-none">{info.icon}</span>
              <span className="hidden sm:inline">{info.name}</span>
            </button>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side action buttons */}
      <div className="flex items-center gap-2 px-4">
        {/* Export PNG */}
        <button
          onClick={onExport}
          title="PNG 내보내기"
          className="flex items-center gap-1.5 rounded-md border border-[#444] bg-[#2A2A2A] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-[#555] hover:bg-[#333] hover:text-white"
        >
          <ImageIcon size={13} />
          PNG
        </button>

        {/* Reset */}
        {onReset && (
          <button
            onClick={onReset}
            title="초기화"
            className="flex items-center gap-1.5 rounded-md border border-[#444] bg-[#2A2A2A] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-[#555] hover:bg-[#333] hover:text-white"
          >
            <RotateCcw size={13} />
            초기화
          </button>
        )}

        {/* 견적 동기화 */}
        {onSync && (
          <button
            onClick={onSync}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            {syncing ? '동기화 중...' : '견적 동기화'}
          </button>
        )}
      </div>
    </div>
  );
}
