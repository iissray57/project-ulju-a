'use client';

import {
  Eye,
  EyeOff,
  Grid3X3,
  Magnet,
  Menu,
  Move3D,
  RotateCcw,
  SquareStack,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useEditorState, useEditorDispatch } from './editor-context';
import { ExportImageButton } from './export-image-button';

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

  const selectedComponent = state.components.find((c) => c.id === state.selectedId);

  const handleDelete = () => {
    if (state.selectedId) {
      dispatch({ type: 'REMOVE_COMPONENT', payload: state.selectedId });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-background px-3 py-2">
      {/* Mobile: 부품 팔레트 열기 버튼 */}
      <Button
        variant="outline"
        size="xs"
        onClick={onOpenMobilePalette}
        className="lg:hidden"
        title="부품 팔레트 열기"
      >
        <Menu className="size-3.5" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6 lg:hidden" />

      {/* Camera mode toggle */}
      <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
        <Button
          variant={state.cameraMode === '2d' ? 'secondary' : 'ghost'}
          size="xs"
          onClick={() => dispatch({ type: 'SET_CAMERA_MODE', payload: '2d' })}
          title="2D 뷰"
        >
          <SquareStack className="size-3.5" />
          <span className="text-xs">2D</span>
        </Button>
        <Button
          variant={state.cameraMode === '3d' ? 'secondary' : 'ghost'}
          size="xs"
          onClick={() => dispatch({ type: 'SET_CAMERA_MODE', payload: '3d' })}
          title="3D 뷰"
        >
          <Move3D className="size-3.5" />
          <span className="text-xs">3D</span>
        </Button>
      </div>

      {/* Camera reset */}
      <Button
        variant="ghost"
        size="xs"
        onClick={() => dispatch({ type: 'RESET_CAMERA' })}
        title="카메라 리셋"
      >
        <RotateCcw className="size-3.5" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Snap toggle */}
      <Button
        variant={state.snapEnabled ? 'secondary' : 'ghost'}
        size="xs"
        onClick={() => dispatch({ type: 'TOGGLE_SNAP' })}
        title={state.snapEnabled ? '스냅 끄기' : '스냅 켜기'}
      >
        <Magnet className="size-3.5" />
        <span className="hidden sm:inline text-xs">스냅</span>
      </Button>

      {/* Dimensions toggle */}
      <Button
        variant={state.showDimensions ? 'secondary' : 'ghost'}
        size="xs"
        onClick={() => dispatch({ type: 'TOGGLE_DIMENSIONS' })}
        title={state.showDimensions ? '치수 숨기기' : '치수 표시'}
      >
        {state.showDimensions ? (
          <Eye className="size-3.5" />
        ) : (
          <EyeOff className="size-3.5" />
        )}
        <span className="hidden sm:inline text-xs">치수</span>
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Grid size */}
      <div className="flex items-center gap-1">
        <Grid3X3 className="size-3.5 text-muted-foreground" />
        {GRID_SIZES.map((gs) => (
          <Button
            key={gs.value}
            variant={state.gridSize === gs.value ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => dispatch({ type: 'SET_GRID_SIZE', payload: gs.value })}
          >
            <span className="text-xs">{gs.label}</span>
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Export image */}
      <ExportImageButton />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Selected component info */}
      {selectedComponent && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {selectedComponent.name} ({selectedComponent.dimensions.width}x
            {selectedComponent.dimensions.height}x{selectedComponent.dimensions.depth}mm)
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleDelete}
            title="삭제"
            className={cn(
              'text-muted-foreground hover:text-destructive'
            )}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
