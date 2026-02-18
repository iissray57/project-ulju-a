'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useEditorDispatch, useEditorState } from './editor-context';
import type {
  ClosetComponent,
  FurnitureCategory,
  FrameColorKey,
  ShelfColorKey,
  ClosetPresetType,
  CornerType,
} from '@/lib/types/closet-editor';
import {
  FURNITURE_CATEGORY_META,
  FRAME_COLOR_OPTIONS,
  SHELF_COLOR_OPTIONS,
} from '@/lib/types/closet-editor';
import {
  WIDTH_OPTIONS,
  DEFAULT_WIDTH,
  UNIT_HEIGHT,
  UNIT_DEPTH,
  createPartsForCategory,
  getTypeInfoForCategory,
} from '@/lib/data/system-presets';

// ── 카테고리 탭 ──────────────────────────────────────

const CATEGORIES: FurnitureCategory[] = ['wardrobe', 'drawer_cabinet', 'bedding_cabinet', 'mirror_cabinet'];
const PRESET_TYPES: ClosetPresetType[] = ['A', 'B', 'C', 'D', 'E', 'F'];

// ── 타입 미니 프리뷰 SVG ──────────────────────────────

function TypePreviewSvg({
  category,
  type,
}: {
  category: FurnitureCategory;
  type: ClosetPresetType;
}) {
  const parts = createPartsForCategory(category, type);
  const h = 60;
  const w = 40;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <rect x={1} y={1} width={w - 2} height={h - 2} fill="none" stroke="currentColor" strokeWidth={1} rx={1} opacity={0.3} />
      <line x1={w / 2} y1={1} x2={w / 2} y2={h - 1} stroke="currentColor" strokeWidth={0.5} opacity={0.2} />
      {parts.map((part, i) => {
        const py = h - 1 - (part.y / UNIT_HEIGHT) * (h - 2);
        if (part.type === 'rod') {
          return (
            <line key={i} x1={4} y1={py} x2={w - 4} y2={py} stroke="currentColor" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
          );
        }
        if (part.type === 'shelf') {
          return (
            <rect key={i} x={3} y={py - 1} width={w - 6} height={2} fill="currentColor" opacity={0.5} />
          );
        }
        if (part.type === 'drawer') {
          const dh = Math.max(4, (part.height / UNIT_HEIGHT) * (h - 2));
          return (
            <g key={i}>
              <rect x={3} y={py - dh} width={w - 6} height={dh} fill="currentColor" opacity={0.15} stroke="currentColor" strokeWidth={0.5} rx={1} />
              <line x1={w / 2 - 4} y1={py - dh / 2} x2={w / 2 + 4} y2={py - dh / 2} stroke="currentColor" strokeWidth={1} opacity={0.4} />
            </g>
          );
        }
        return null;
      })}
    </svg>
  );
}

// ── 색상 선택기 ──────────────────────────────────────

function ColorPicker<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Record<string, { label: string; hex: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(options).map(([key, opt]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key as T)}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-md border p-1 transition-colors min-w-[44px]',
              value === key
                ? 'border-primary bg-primary/10 ring-1 ring-primary'
                : 'border-border hover:bg-accent'
            )}
            title={opt.label}
          >
            <div
              className="size-5 rounded-sm border border-border/50"
              style={{ backgroundColor: opt.hex }}
            />
            <span className="text-[9px] leading-tight">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 너비 선택기 ──────────────────────────────────────

function WidthSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">너비 (mm)</Label>
      <div className="flex flex-wrap gap-1">
        {WIDTH_OPTIONS.map((w) => (
          <Button
            key={w}
            type="button"
            variant={value === w ? 'secondary' : 'outline'}
            size="xs"
            onClick={() => onChange(w)}
            className="text-xs min-w-[42px]"
          >
            {w}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ── 속성 편집 패널 ──────────────────────────────────

function PropertyPanel() {
  const state = useEditorState();
  const dispatch = useEditorDispatch();
  const selected = state.components.find((c) => c.id === state.selectedId);

  if (!selected || !selected.furnitureCategory) {
    return (
      <div className="px-3 py-4 text-center text-xs text-muted-foreground">
        가구를 선택하면 속성을 편집할 수 있습니다
      </div>
    );
  }

  const update = (changes: Partial<ClosetComponent>) => {
    dispatch({ type: 'UPDATE_COMPONENT', payload: { id: selected.id, changes } });
  };

  const meta = FURNITURE_CATEGORY_META[selected.furnitureCategory];

  return (
    <div className="px-3 py-3 space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase">속성</h3>
      <div className="text-xs">
        <span className="font-medium">{selected.name}</span>
        <span className="text-muted-foreground ml-1">
          {selected.dimensions.width}x{selected.dimensions.depth}mm
        </span>
      </div>

      {selected.frameColor && (
        <ColorPicker
          label="프레임 색상"
          options={FRAME_COLOR_OPTIONS}
          value={selected.frameColor}
          onChange={(v) => update({ frameColor: v })}
        />
      )}

      {meta.hasShelfColor && selected.shelfColor && (
        <ColorPicker
          label="선반 색상"
          options={SHELF_COLOR_OPTIONS}
          value={selected.shelfColor}
          onChange={(v) => update({ shelfColor: v })}
        />
      )}
    </div>
  );
}

// ── Main PartsPalette ──────────────────────────────

export function PartsPalette() {
  const dispatch = useEditorDispatch();

  const [activeCategory, setActiveCategory] = useState<FurnitureCategory>('wardrobe');
  const [selectedType, setSelectedType] = useState<ClosetPresetType>('A');
  const [selectedWidth, setSelectedWidth] = useState(DEFAULT_WIDTH);
  const [selectedFrameColor, setSelectedFrameColor] = useState<FrameColorKey>('silver');
  const [selectedShelfColor, setSelectedShelfColor] = useState<ShelfColorKey>('white');
  const [cornerMode, setCornerMode] = useState<CornerType | null>(null);

  const meta = FURNITURE_CATEGORY_META[activeCategory];
  const typeInfo = getTypeInfoForCategory(activeCategory);

  const handleAddFurniture = () => {
    const width = meta.fixedWidth ?? selectedWidth;
    const depth = meta.fixedDepth ?? UNIT_DEPTH;
    const parts = meta.hasTypes
      ? createPartsForCategory(activeCategory, selectedType)
      : [];

    const typeSuffix = meta.hasTypes ? ` ${selectedType}타입` : '';
    const cornerSuffix = cornerMode ? ` ${cornerMode === 'L' ? 'ㄱ' : 'ㄴ'}코너` : '';
    const name = `${meta.label}${typeSuffix} ${width}${cornerSuffix}`;

    const component: ClosetComponent = {
      id: crypto.randomUUID(),
      name,
      shapeType: 'rect',
      furnitureCategory: activeCategory,
      furnitureType: meta.dressingType,
      presetType: meta.hasTypes ? selectedType : undefined,
      cornerType: cornerMode ?? undefined,
      frameColor: selectedFrameColor,
      shelfColor: meta.hasShelfColor ? selectedShelfColor : undefined,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      dimensions: { width, height: UNIT_HEIGHT, depth },
      color: FRAME_COLOR_OPTIONS[selectedFrameColor].hex,
      borderColor: '#64748b',
      locked: false,
      parts,
    };

    dispatch({ type: 'ADD_COMPONENT', payload: component });
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-background">
      <div className="border-b border-border px-3 py-2">
        <h2 className="text-sm font-semibold">가구 선택</h2>
      </div>

      {/* 카테고리 탭 */}
      <div className="grid grid-cols-4 border-b border-border">
        {CATEGORIES.map((cat) => {
          const catMeta = FURNITURE_CATEGORY_META[cat];
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'py-2 text-xs font-medium transition-colors border-b-2',
                activeCategory === cat
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {catMeta.label}
            </button>
          );
        })}
      </div>

      {/* 설정 영역 */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* 타입 선택 (A~F) */}
        {meta.hasTypes && typeInfo && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">타입 선택</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {PRESET_TYPES.map((type) => {
                const info = typeInfo[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-md border p-2 transition-colors',
                      selectedType === type
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'border-border hover:bg-accent'
                    )}
                  >
                    <TypePreviewSvg category={activeCategory} type={type} />
                    <span className="text-xs font-medium">{info.label}</span>
                    <span className="text-[9px] text-muted-foreground leading-tight text-center">
                      {info.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 거울장 고정 사이즈 안내 */}
        {activeCategory === 'mirror_cabinet' && (
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              거울장은 <span className="font-medium text-foreground">400 x 400mm</span> 고정 사이즈입니다.
            </p>
          </div>
        )}

        {/* 너비 선택 */}
        {!meta.fixedWidth && (
          <WidthSelector value={selectedWidth} onChange={setSelectedWidth} />
        )}

        {/* 코너 형태 선택 (거울장 제외) */}
        {activeCategory !== 'mirror_cabinet' && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">형태</Label>
            <div className="flex gap-1">
              <Button
                type="button"
                variant={cornerMode === null ? 'secondary' : 'outline'}
                size="xs"
                onClick={() => setCornerMode(null)}
                className="flex-1 text-xs"
              >
                일반
              </Button>
              <Button
                type="button"
                variant={cornerMode === 'L' ? 'secondary' : 'outline'}
                size="xs"
                onClick={() => setCornerMode('L')}
                className="flex-1 text-xs"
              >
                ㄱ 코너
              </Button>
              <Button
                type="button"
                variant={cornerMode === 'R' ? 'secondary' : 'outline'}
                size="xs"
                onClick={() => setCornerMode('R')}
                className="flex-1 text-xs"
              >
                ㄴ 코너
              </Button>
            </div>
          </div>
        )}

        {/* 프레임 색상 */}
        <ColorPicker
          label="프레임 색상"
          options={FRAME_COLOR_OPTIONS}
          value={selectedFrameColor}
          onChange={setSelectedFrameColor}
        />

        {/* 선반 색상 (옷장만) */}
        {meta.hasShelfColor && (
          <ColorPicker
            label="선반 색상"
            options={SHELF_COLOR_OPTIONS}
            value={selectedShelfColor}
            onChange={setSelectedShelfColor}
          />
        )}

        {/* 추가 버튼 */}
        <Button onClick={handleAddFurniture} className="w-full" size="sm">
          {meta.label} 추가
        </Button>
      </div>

      {/* 속성 패널 */}
      <div className="border-t border-border">
        <PropertyPanel />
      </div>
    </div>
  );
}
