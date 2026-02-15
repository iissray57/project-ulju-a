'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useEditorDispatch, useEditorState } from './editor-context';
import type { ClosetComponent, ShapeType } from '@/lib/types/closet-editor';

// ── 프리셋 데이터 ──────────────────────────

interface ShapePreset {
  name: string;
  category: string;
  shapeType: ShapeType;
  width: number;
  depth: number;
  color: string;
  borderColor?: string;
  borderRadius?: number;
  label?: string;
}

// 프레임 타입별 색상 (배경 / 테두리)
const FRAME_COLORS: Record<string, { bg: string; border: string }> = {
  A: { bg: '#DBEAFE', border: '#3B82F6' },  // Blue - 선반장
  B: { bg: '#D1FAE5', border: '#10B981' },  // Green - 행거장 (상단선반)
  C: { bg: '#FEF3C7', border: '#F59E0B' },  // Amber - 행거장 (전체)
  D: { bg: '#FCE7F3', border: '#EC4899' },  // Pink - 서랍형
  E: { bg: '#E0E7FF', border: '#6366F1' },  // Indigo - 혼합형
  F: { bg: '#F3E8FF', border: '#A855F7' },  // Purple - 특수형
};

const FRAME_WIDTHS = [600, 700, 800, 900];
const FRAME_DEPTH = 600;

const SHAPE_CATEGORIES = [
  { value: 'frame', label: '프레임 타입' },
  { value: 'parts', label: '부속품' },
  { value: 'room', label: '공간 요소' },
];

// 프레임 타입 A~F × 폭 600/700/800/900
function generateFramePresets(): ShapePreset[] {
  const types: { key: string; desc: string }[] = [
    { key: 'A', desc: '선반장' },
    { key: 'B', desc: '행거(상단선반)' },
    { key: 'C', desc: '행거(전체)' },
    { key: 'D', desc: '서랍형' },
    { key: 'E', desc: '혼합형' },
    { key: 'F', desc: '특수형' },
  ];

  const presets: ShapePreset[] = [];
  for (const t of types) {
    const colors = FRAME_COLORS[t.key];
    for (const w of FRAME_WIDTHS) {
      presets.push({
        name: `${t.key} ${w} (${t.desc})`,
        category: 'frame',
        shapeType: 'rect',
        width: w,
        depth: FRAME_DEPTH,
        color: colors.bg,
        borderColor: colors.border,
        label: `${t.key} ${w}`,
      });
    }
  }
  return presets;
}

const SHAPE_PRESETS: ShapePreset[] = [
  // 프레임 타입 A~F
  ...generateFramePresets(),

  // 부속품
  { name: '선반 (600)', category: 'parts', shapeType: 'rect', width: 600, depth: 40, color: '#E8DCC4', borderColor: '#C4B08A', label: '선반' },
  { name: '선반 (800)', category: 'parts', shapeType: 'rect', width: 800, depth: 40, color: '#E8DCC4', borderColor: '#C4B08A', label: '선반' },
  { name: '칸막이 (세로)', category: 'parts', shapeType: 'rect', width: 20, depth: 600, color: '#D1D5DB', borderColor: '#9CA3AF', label: '칸막이' },
  { name: '행거바 (600)', category: 'parts', shapeType: 'rounded-rect', width: 600, depth: 30, color: '#93C5FD', borderColor: '#3B82F6', borderRadius: 15, label: '행거바' },
  { name: '행거바 (800)', category: 'parts', shapeType: 'rounded-rect', width: 800, depth: 30, color: '#93C5FD', borderColor: '#3B82F6', borderRadius: 15, label: '행거바' },
  { name: '서랍 (600)', category: 'parts', shapeType: 'rect', width: 600, depth: 200, color: '#FDE68A', borderColor: '#D97706', label: '서랍' },
  { name: '서랍 (800)', category: 'parts', shapeType: 'rect', width: 800, depth: 200, color: '#FDE68A', borderColor: '#D97706', label: '서랍' },

  // 공간 요소
  { name: '벽면 (2000)', category: 'room', shapeType: 'rect', width: 2000, depth: 100, color: '#9CA3AF', borderColor: '#6B7280' },
  { name: '벽면 (3000)', category: 'room', shapeType: 'rect', width: 3000, depth: 100, color: '#9CA3AF', borderColor: '#6B7280' },
  { name: '벽면 (세로 2000)', category: 'room', shapeType: 'rect', width: 100, depth: 2000, color: '#9CA3AF', borderColor: '#6B7280' },
  { name: '문 (800)', category: 'room', shapeType: 'rounded-rect', width: 800, depth: 80, color: '#A3E635', borderColor: '#65A30D', borderRadius: 5 },
  { name: '라벨', category: 'room', shapeType: 'rect', width: 300, depth: 120, color: '#FEF3C7', borderColor: '#F59E0B', label: '메모' },
];

function createComponentFromPreset(preset: ShapePreset): ClosetComponent {
  return {
    id: crypto.randomUUID(),
    name: preset.name,
    shapeType: preset.shapeType,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    dimensions: { width: preset.width, height: 100, depth: preset.depth },
    color: preset.color,
    borderColor: preset.borderColor,
    borderRadius: preset.borderRadius,
    label: preset.label,
    locked: false,
  };
}

// ── 프리셋 카드 ──────────────────────────

function PresetCard({ preset, onClick }: { preset: ShapePreset; onClick: () => void }) {
  const isFrame = preset.category === 'frame';
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-md border border-border bg-card p-2 hover:bg-accent hover:border-accent-foreground transition-colors"
    >
      <div className="flex items-center gap-2">
        {/* Shape preview */}
        <div
          className="shrink-0 border flex items-center justify-center"
          style={{
            width: isFrame ? 40 : 32,
            height: isFrame ? Math.max(20, 40 * (preset.depth / preset.width)) : Math.max(12, 32 * (preset.depth / preset.width)),
            backgroundColor: preset.color,
            borderColor: preset.borderColor || 'transparent',
            borderWidth: isFrame ? 2 : 1,
            borderRadius: preset.shapeType === 'circle'
              ? '50%'
              : preset.borderRadius
                ? `${Math.min(preset.borderRadius / 10, 8)}px`
                : '2px',
          }}
        >
          {isFrame && preset.label && (
            <span className="text-[8px] font-bold" style={{ color: preset.borderColor }}>
              {preset.label.split(' ')[0]}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate">{preset.name}</div>
          <div className="text-[10px] text-muted-foreground">
            {preset.width}×{preset.depth}mm
          </div>
        </div>
      </div>
    </button>
  );
}

// ── 속성 편집 패널 ──────────────────────────

function PropertyPanel() {
  const state = useEditorState();
  const dispatch = useEditorDispatch();
  const selected = state.components.find((c) => c.id === state.selectedId);

  if (!selected) {
    return (
      <div className="px-3 py-4 text-center text-xs text-muted-foreground">
        객체를 선택하면 속성을 편집할 수 있습니다
      </div>
    );
  }

  const update = (changes: Partial<ClosetComponent>) => {
    dispatch({ type: 'UPDATE_COMPONENT', payload: { id: selected.id, changes } });
  };

  return (
    <div className="px-3 py-3 space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase">속성</h3>

      <div className="space-y-2">
        <Label className="text-xs">이름</Label>
        <Input
          value={selected.name}
          onChange={(e) => update({ name: e.target.value })}
          className="h-7 text-xs"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">가로 (mm)</Label>
          <Input
            type="number"
            value={selected.dimensions.width}
            onChange={(e) => update({ dimensions: { ...selected.dimensions, width: Number(e.target.value) || 0 } })}
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">세로 (mm)</Label>
          <Input
            type="number"
            value={selected.dimensions.depth}
            onChange={(e) => update({ dimensions: { ...selected.dimensions, depth: Number(e.target.value) || 0 } })}
            className="h-7 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">배경색</Label>
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={selected.color}
              onChange={(e) => update({ color: e.target.value })}
              className="h-7 w-7 rounded border cursor-pointer"
            />
            <Input
              value={selected.color}
              onChange={(e) => update({ color: e.target.value })}
              className="h-7 text-xs flex-1"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">테두리색</Label>
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={selected.borderColor || '#000000'}
              onChange={(e) => update({ borderColor: e.target.value })}
              className="h-7 w-7 rounded border cursor-pointer"
            />
            <Input
              value={selected.borderColor || ''}
              onChange={(e) => update({ borderColor: e.target.value || undefined })}
              className="h-7 text-xs flex-1"
              placeholder="없음"
            />
          </div>
        </div>
      </div>

      {(selected.shapeType === 'rounded-rect') && (
        <div className="space-y-1">
          <Label className="text-xs">모서리 반경 (mm)</Label>
          <Input
            type="number"
            value={selected.borderRadius || 0}
            onChange={(e) => update({ borderRadius: Number(e.target.value) || 0 })}
            className="h-7 text-xs"
          />
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs">라벨 텍스트</Label>
        <Input
          value={selected.label || ''}
          onChange={(e) => update({ label: e.target.value || undefined })}
          className="h-7 text-xs"
          placeholder="없음"
        />
      </div>
    </div>
  );
}

// ── Main PartsPalette ──────────────────────────

export function PartsPalette() {
  const dispatch = useEditorDispatch();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPresets = SHAPE_PRESETS.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presetsByCategory = SHAPE_CATEGORIES.map((cat) => ({
    ...cat,
    items: filteredPresets.filter((p) => p.category === cat.value),
  })).filter((cat) => cat.items.length > 0);

  const handlePresetClick = (preset: ShapePreset) => {
    const component = createComponentFromPreset(preset);
    dispatch({ type: 'ADD_COMPONENT', payload: component });
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-background">
      <div className="border-b border-border px-3 py-2">
        <h2 className="text-sm font-semibold">부품 팔레트</h2>
      </div>

      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="부품 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Shape presets */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {presetsByCategory.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            검색 결과가 없습니다.
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={presetsByCategory.map((c) => c.value)} className="space-y-1">
            {presetsByCategory.map((category) => (
              <AccordionItem key={category.value} value={category.value} className="border-none">
                <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                  {category.label} ({category.items.length})
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-2">
                  <div className="space-y-1">
                    {category.items.map((preset, idx) => (
                      <PresetCard
                        key={`${category.value}-${idx}`}
                        preset={preset}
                        onClick={() => handlePresetClick(preset)}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Property panel */}
      <div className="border-t border-border">
        <PropertyPanel />
      </div>
    </div>
  );
}
