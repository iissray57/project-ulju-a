'use client';

import {
  Circle,
  Eye,
  EyeOff,
  Grid3X3,
  Magnet,
  Menu,
  RectangleHorizontal,
  RotateCcw,
  Square,
  Trash2,
  Type,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useEditorState, useEditorDispatch } from './editor-context';
import { ExportImageButton } from './export-image-button';
import type { ClosetComponent, ShapeType } from '@/lib/types/closet-editor';

const GRID_SIZES = [
  { value: 25, label: '25mm' },
  { value: 50, label: '50mm' },
  { value: 100, label: '100mm' },
];

const SHAPE_TOOLS: { type: ShapeType; icon: typeof Square; label: string; defaults: Partial<ClosetComponent> }[] = [
  {
    type: 'rect',
    icon: Square,
    label: '사각형',
    defaults: {
      dimensions: { width: 600, height: 100, depth: 400 },
      color: '#e2e8f0',
      borderColor: '#94a3b8',
    },
  },
  {
    type: 'rounded-rect',
    icon: RectangleHorizontal,
    label: '둥근 사각형',
    defaults: {
      dimensions: { width: 600, height: 100, depth: 400 },
      color: '#dbeafe',
      borderColor: '#60a5fa',
      borderRadius: 30,
    },
  },
  {
    type: 'circle',
    icon: Circle,
    label: '원형',
    defaults: {
      dimensions: { width: 400, height: 100, depth: 400 },
      color: '#fce7f3',
      borderColor: '#f472b6',
    },
  },
  {
    type: 'text',
    icon: Type,
    label: '텍스트',
    defaults: {
      dimensions: { width: 400, height: 50, depth: 200 },
      color: '#fef3c7',
      borderColor: '#f59e0b',
      label: '텍스트',
    },
  },
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

  const handleAddShape = (tool: (typeof SHAPE_TOOLS)[number]) => {
    const component: ClosetComponent = {
      id: crypto.randomUUID(),
      name: tool.label,
      shapeType: tool.type,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      dimensions: tool.defaults.dimensions!,
      color: tool.defaults.color!,
      borderColor: tool.defaults.borderColor,
      borderRadius: tool.defaults.borderRadius,
      label: tool.defaults.label,
      locked: false,
    };
    dispatch({ type: 'ADD_COMPONENT', payload: component });
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-background px-3 py-2">
      {/* Mobile: palette toggle */}
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

      {/* Shape tools */}
      <div className="flex items-center gap-1">
        {SHAPE_TOOLS.map((tool) => (
          <Button
            key={tool.type}
            variant="ghost"
            size="xs"
            onClick={() => handleAddShape(tool)}
            title={`${tool.label} 추가`}
          >
            <tool.icon className="size-3.5" />
            <span className="hidden sm:inline text-xs">{tool.label}</span>
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Camera reset */}
      <Button
        variant="ghost"
        size="xs"
        onClick={() => dispatch({ type: 'RESET_CAMERA' })}
        title="뷰 리셋"
      >
        <RotateCcw className="size-3.5" />
      </Button>

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
        {state.showDimensions ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
        <span className="hidden sm:inline text-xs">치수</span>
      </Button>

      {/* Grid toggle */}
      <Button
        variant={state.showGrid ? 'secondary' : 'ghost'}
        size="xs"
        onClick={() => dispatch({ type: 'TOGGLE_GRID' })}
        title={state.showGrid ? '그리드 숨기기' : '그리드 표시'}
      >
        <Grid3X3 className="size-3.5" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Grid size */}
      <div className="flex items-center gap-1">
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
            size="icon-xs"
            onClick={handleDelete}
            title="삭제"
            className={cn('text-muted-foreground hover:text-destructive')}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
