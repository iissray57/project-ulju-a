'use client';

import { useState } from 'react';
import { MousePointer2, ChevronDown, ChevronRight } from 'lucide-react';
import { useFloorPlan } from '../floor-plan-context';
import { OBJECT_CATALOG } from '../data/object-catalog';
import type { FloorObjectType } from '../types';

interface CategoryGroup {
  label: string;
  types: FloorObjectType[];
}

const CATEGORIES: CategoryGroup[] = [
  {
    label: '수납장',
    types: ['shelving_unit', 'hanger_rack', 'drawer_unit', 'shoe_rack'],
  },
  {
    label: '비품',
    types: ['mirror', 'island'],
  },
  {
    label: '개구부',
    types: ['door', 'window'],
  },
];

function ObjectTypeIcon({ type }: { type: FloorObjectType }) {
  const colors: Record<FloorObjectType, string> = {
    shelving_unit: '#8B9DC3',
    hanger_rack: '#A8D8A8',
    drawer_unit: '#F4A261',
    shoe_rack: '#E8C4A2',
    mirror: '#B8D4E8',
    island: '#D4C5E2',
    door: '#D2B48C',
    window: '#87CEEB',
  };
  return (
    <div
      className="w-8 h-8 rounded flex-shrink-0"
      style={{ backgroundColor: colors[type] }}
    />
  );
}

interface CategorySectionProps {
  group: CategoryGroup;
  selectedType: FloorObjectType | null;
  onSelect: (type: FloorObjectType) => void;
}

function CategorySection({ group, selectedType, onSelect }: CategorySectionProps) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center w-full px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50 transition-colors"
      >
        {open ? (
          <ChevronDown className="w-3 h-3 mr-1.5 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 mr-1.5 flex-shrink-0" />
        )}
        {group.label}
      </button>

      {open && (
        <div className="space-y-0.5 px-2 pb-1">
          {group.types.map((type) => {
            const entry = OBJECT_CATALOG[type];
            const isSelected = selectedType === type;
            return (
              <button
                key={type}
                onClick={() => onSelect(type)}
                className={[
                  'flex items-center gap-2.5 w-full px-2 py-2 rounded-md text-left transition-colors',
                  isSelected
                    ? 'border-2 border-orange-400 bg-orange-50'
                    : 'border-2 border-transparent hover:bg-gray-100',
                ].join(' ')}
              >
                <ObjectTypeIcon type={type} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {entry.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {entry.defaultWidth} × {entry.defaultDepth} mm
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ObjectPalette() {
  const { state, setPlacingType, setTool } = useFloorPlan();

  function handleSelect(type: FloorObjectType) {
    setPlacingType(type);
  }

  function handleSelectMode() {
    setTool('select');
    setPlacingType(null);
  }

  const isSelectMode = state.activeTool === 'select';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 헤더 */}
      <div className="px-3 py-3 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-800">객체 라이브러리</h3>
      </div>

      {/* 선택 모드 버튼 */}
      <div className="px-2 py-2 flex-shrink-0">
        <button
          onClick={handleSelectMode}
          className={[
            'flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors',
            isSelectMode
              ? 'bg-orange-100 text-orange-700 border border-orange-300'
              : 'text-gray-600 hover:bg-gray-100 border border-transparent',
          ].join(' ')}
        >
          <MousePointer2 className="w-4 h-4" />
          선택 모드
        </button>
      </div>

      {/* 카테고리 목록 */}
      <div className="flex-1 overflow-y-auto">
        {CATEGORIES.map((group) => (
          <CategorySection
            key={group.label}
            group={group}
            selectedType={state.activeTool === 'place' ? state.placingObjectType : null}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
