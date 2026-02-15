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

// ── 프리셋 도형 데이터 ──────────────────────────

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

const SHAPE_CATEGORIES = [
  { value: 'basic', label: '기본 도형' },
  { value: 'closet', label: '수납장 부품' },
  { value: 'room', label: '공간 요소' },
];

const SHAPE_PRESETS: ShapePreset[] = [
  // 기본 도형
  { name: '사각형 (소)', category: 'basic', shapeType: 'rect', width: 300, depth: 300, color: '#e2e8f0', borderColor: '#94a3b8' },
  { name: '사각형 (중)', category: 'basic', shapeType: 'rect', width: 600, depth: 400, color: '#e2e8f0', borderColor: '#94a3b8' },
  { name: '사각형 (대)', category: 'basic', shapeType: 'rect', width: 900, depth: 600, color: '#e2e8f0', borderColor: '#94a3b8' },
  { name: '둥근 사각형 (소)', category: 'basic', shapeType: 'rounded-rect', width: 300, depth: 300, color: '#dbeafe', borderColor: '#60a5fa', borderRadius: 20 },
  { name: '둥근 사각형 (중)', category: 'basic', shapeType: 'rounded-rect', width: 600, depth: 400, color: '#dbeafe', borderColor: '#60a5fa', borderRadius: 30 },
  { name: '둥근 사각형 (대)', category: 'basic', shapeType: 'rounded-rect', width: 900, depth: 600, color: '#dbeafe', borderColor: '#60a5fa', borderRadius: 40 },
  { name: '원형 (소)', category: 'basic', shapeType: 'circle', width: 300, depth: 300, color: '#fce7f3', borderColor: '#f472b6' },
  { name: '원형 (중)', category: 'basic', shapeType: 'circle', width: 500, depth: 500, color: '#fce7f3', borderColor: '#f472b6' },
  { name: '라벨', category: 'basic', shapeType: 'rounded-rect', width: 400, depth: 150, color: '#fef3c7', borderColor: '#f59e0b', borderRadius: 10, label: '라벨' },

  // 수납장 부품
  { name: '프레임 (600×400)', category: 'closet', shapeType: 'rect', width: 600, depth: 400, color: '#C0C0C0', borderColor: '#888888' },
  { name: '프레임 (900×400)', category: 'closet', shapeType: 'rect', width: 900, depth: 400, color: '#C0C0C0', borderColor: '#888888' },
  { name: '프레임 (1200×400)', category: 'closet', shapeType: 'rect', width: 1200, depth: 400, color: '#C0C0C0', borderColor: '#888888' },
  { name: '선반 (600×300)', category: 'closet', shapeType: 'rect', width: 600, depth: 300, color: '#E8DCC4', borderColor: '#C4B08A' },
  { name: '선반 (900×300)', category: 'closet', shapeType: 'rect', width: 900, depth: 300, color: '#E8DCC4', borderColor: '#C4B08A' },
  { name: '서랍 (800×400)', category: 'closet', shapeType: 'rounded-rect', width: 800, depth: 400, color: '#F5DEB3', borderColor: '#D4A760', borderRadius: 10 },
  { name: '행거 바 (900×50)', category: 'closet', shapeType: 'rounded-rect', width: 900, depth: 50, color: '#D1D5DB', borderColor: '#9CA3AF', borderRadius: 25 },

  // 공간 요소
  { name: '벽면 (2000×100)', category: 'room', shapeType: 'rect', width: 2000, depth: 100, color: '#d1d5db', borderColor: '#6b7280' },
  { name: '벽면 (3000×100)', category: 'room', shapeType: 'rect', width: 3000, depth: 100, color: '#d1d5db', borderColor: '#6b7280' },
  { name: '기둥 (200×200)', category: 'room', shapeType: 'rect', width: 200, depth: 200, color: '#9ca3af', borderColor: '#6b7280' },
  { name: '문 (800×100)', category: 'room', shapeType: 'rounded-rect', width: 800, depth: 100, color: '#a3e635', borderColor: '#65a30d', borderRadius: 5 },
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
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-md border border-border bg-card p-2.5 hover:bg-accent hover:border-accent-foreground transition-colors"
    >
      <div className="flex items-center gap-2">
        {/* Shape preview */}
        <div
          className="shrink-0 border"
          style={{
            width: 32,
            height: Math.max(16, 32 * (preset.depth / preset.width)),
            backgroundColor: preset.color,
            borderColor: preset.borderColor || 'transparent',
            borderRadius: preset.shapeType === 'circle'
              ? '50%'
              : preset.borderRadius
                ? `${Math.min(preset.borderRadius / 10, 8)}px`
                : '2px',
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{preset.name}</div>
          <div className="text-xs text-muted-foreground">
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

      {selected.label !== undefined && (
        <div className="space-y-1">
          <Label className="text-xs">라벨 텍스트</Label>
          <Input
            value={selected.label || ''}
            onChange={(e) => update({ label: e.target.value })}
            className="h-7 text-xs"
          />
        </div>
      )}
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
        <h2 className="text-sm font-semibold">도형 팔레트</h2>
      </div>

      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="도형 검색..."
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
                  <div className="space-y-1.5">
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
