'use client';

import {
  Box,
  Eye,
  EyeOff,
  Grid3X3,
  Layers,
  Magnet,
  Menu,
  Redo2,
  RotateCcw,
  SquareStack,
  Trash2,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useEditorState, useEditorDispatch, useEditorHistory } from './editor-context';
import { ExportImageButton } from './export-image-button';
import type { ViewMode } from '@/lib/types/closet-editor';

const VIEW_MODES: { mode: ViewMode; icon: typeof Layers; label: string }[] = [
  { mode: 'plan', icon: Layers, label: '평면도' },
  { mode: 'elevation', icon: SquareStack, label: '정면도' },
  { mode: '3d', icon: Box, label: '3D' },
];

const GRID_SIZES = [
  { value: 25, label: '25mm' },
  { value: 50, label: '50mm' },
  { value: 100, label: '100mm' },
];

interface EditorToolbarProps {
  onOpenMobilePalette?: () => void;
}

export function EditorToolbar({ onOpenMobilePalette }: EditorToolbarProps) {
  const state = useEditorState();
  const dispatch = useEditorDispatch();
  const { canUndo, canRedo } = useEditorHistory();

  const selectedComponent = state.components.find((c) => c.id === state.selectedId);

  const handleDelete = () => {
    if (state.selectedId) {
      dispatch({ type: 'REMOVE_COMPONENT', payload: state.selectedId });
    }
  };

  const handleUndo = () => dispatch({ type: 'UNDO' });
  const handleRedo = () => dispatch({ type: 'REDO' });

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-background px-3 py-2">
      {/* Mobile: palette toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenMobilePalette}
        className="lg:hidden h-8"
        title="가구 팔레트 열기"
      >
        <Menu className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-8 lg:hidden" />

      {/* View mode toggle */}
      <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5 h-8">
        {VIEW_MODES.map((vm) => (
          <Button
            key={vm.mode}
            variant={state.viewMode === vm.mode ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: vm.mode })}
            title={vm.label}
            className="h-7 px-2"
          >
            <vm.icon className="size-4" />
            <span className="hidden sm:inline text-xs ml-1">{vm.label}</span>
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="mx-1 h-8" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="sm" onClick={handleUndo} disabled={!canUndo} title="실행 취소" className="h-8">
          <Undo2 className="size-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleRedo} disabled={!canRedo} title="다시 실행" className="h-8">
          <Redo2 className="size-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-8" />

      {/* Camera reset */}
      <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'RESET_CAMERA' })} title="뷰 리셋" className="h-8">
        <RotateCcw className="size-4" />
      </Button>

      {/* Snap toggle */}
      <Button
        variant={state.snapEnabled ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => dispatch({ type: 'TOGGLE_SNAP' })}
        title={state.snapEnabled ? '스냅 끄기' : '스냅 켜기'}
        className="h-8"
      >
        <Magnet className="size-4" />
        <span className="hidden sm:inline text-xs">스냅</span>
      </Button>

      {/* Dimensions toggle */}
      <Button
        variant={state.showDimensions ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => dispatch({ type: 'TOGGLE_DIMENSIONS' })}
        title={state.showDimensions ? '치수 숨기기' : '치수 표시'}
        className="h-8"
      >
        {state.showDimensions ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        <span className="hidden sm:inline text-xs">치수</span>
      </Button>

      {/* Grid toggle */}
      <Button
        variant={state.showGrid ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => dispatch({ type: 'TOGGLE_GRID' })}
        title={state.showGrid ? '그리드 숨기기' : '그리드 표시'}
        className="h-8"
      >
        <Grid3X3 className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-8" />

      {/* Grid size */}
      <div className="flex items-center gap-1">
        {GRID_SIZES.map((gs) => (
          <Button
            key={gs.value}
            variant={state.gridSize === gs.value ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => dispatch({ type: 'SET_GRID_SIZE', payload: gs.value })}
            className="h-8"
          >
            <span className="text-xs">{gs.label}</span>
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="mx-1 h-8" />

      <ExportImageButton />

      <div className="flex-1" />

      {/* Selected component info */}
      {selectedComponent && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {selectedComponent.name} ({selectedComponent.dimensions.width}x
            {selectedComponent.dimensions.depth}mm)
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            title="삭제"
            className={cn('h-8 text-muted-foreground hover:text-destructive')}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
