'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PRESET_CATEGORIES } from '@/lib/schemas/closet-preset';
import { SYSTEM_PRESETS, type SystemPreset } from '@/lib/data/system-presets';
import { useEditorDispatch } from './editor-context';
import type { ClosetPreset } from '@/app/(dashboard)/closet/actions';
import type { ClosetComponent } from '@/lib/types/closet-editor';

interface PartsPaletteProps {
  userPresets?: ClosetPreset[];
}

/**
 * 프리셋 -> ClosetComponent 변환 헬퍼
 */
function createComponentFromPreset(
  preset: SystemPreset | ClosetPreset
): ClosetComponent {
  const data = preset.preset_data as {
    width: number;
    height: number;
    depth: number;
    color?: string;
    material?: string;
  };
  const isUserPreset = 'id' in preset;

  return {
    id: crypto.randomUUID(),
    presetId: isUserPreset ? preset.id : undefined,
    name: preset.name,
    position: [0, (data.height / 100) / 2, 0], // mm -> scene unit, center height
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    dimensions: {
      width: data.width,
      height: data.height,
      depth: data.depth,
    },
    color: data.color || '#8b7355',
    material: data.material || 'wood',
    locked: false,
  };
}

/**
 * 프리셋 아이템 컴포넌트
 */
function PresetItem({
  preset,
  onClick,
}: {
  preset: SystemPreset | ClosetPreset;
  onClick: () => void;
}) {
  const data = preset.preset_data as {
    width: number;
    height: number;
    depth: number;
    color?: string;
    material?: string;
  };
  const isSystem = 'is_system' in preset && preset.is_system;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-md border border-border bg-card p-2.5 hover:bg-accent hover:border-accent-foreground transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{preset.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {String(data.width)}×{String(data.height)}×{String(data.depth)}mm
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {/* 색상 미리보기 */}
          {data.color && (
            <div
              className="size-4 rounded-sm border border-border"
              style={{ backgroundColor: data.color as string }}
              title={`색상: ${data.color}`}
            />
          )}
          {/* 재질 뱃지 */}
          <Badge variant="secondary" className="text-xs px-1 py-0">
            {data.material || 'N/A'}
          </Badge>
        </div>
      </div>
      {/* 시스템 프리셋 뱃지 */}
      {isSystem && (
        <Badge variant="outline" className="text-xs px-1 py-0 mt-1.5">
          시스템
        </Badge>
      )}
    </button>
  );
}

/**
 * 부품 팔레트 컴포넌트
 */
export function PartsPalette({ userPresets = [] }: PartsPaletteProps) {
  const dispatch = useEditorDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 모든 프리셋 합치기 (시스템 + 사용자)
  const allPresets: (SystemPreset | ClosetPreset)[] = [
    ...SYSTEM_PRESETS,
    ...userPresets,
  ];

  // 필터링
  const filteredPresets = allPresets.filter((preset) => {
    const matchesSearch = preset.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || preset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 카테고리별 그룹화
  const presetsByCategory = PRESET_CATEGORIES.map((cat) => ({
    ...cat,
    items: filteredPresets.filter((p) => p.category === cat.value),
  })).filter((cat) => cat.items.length > 0);

  // 프리셋 클릭 시 에디터에 추가
  const handlePresetClick = (preset: SystemPreset | ClosetPreset) => {
    const component = createComponentFromPreset(preset);
    dispatch({ type: 'ADD_COMPONENT', payload: component });
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-background">
      {/* Header */}
      <div className="border-b border-border px-3 py-2">
        <h2 className="text-sm font-semibold">부품 팔레트</h2>
      </div>

      {/* Search */}
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

      {/* Category filter tabs */}
      <div className="flex gap-1 overflow-x-auto px-3 py-2 border-b border-border">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-secondary text-secondary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          전체
        </button>
        {PRESET_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setSelectedCategory(cat.value)}
            className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              selectedCategory === cat.value
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Preset list */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {presetsByCategory.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            {searchQuery ? '검색 결과가 없습니다.' : '프리셋이 없습니다.'}
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
                      <PresetItem
                        key={`${'id' in preset ? preset.id : `system-${category.value}-${idx}`}`}
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
    </div>
  );
}
