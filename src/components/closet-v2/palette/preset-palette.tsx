'use client';

import { useState } from 'react';
import {
  PRESET_TYPE_INFO,
  DRESSING_FURNITURE_PRESETS,
  FURNITURE_TYPE_INFO,
  type DressingFurniturePreset,
} from '@/lib/data/system-presets';
import type { ClosetPresetType, CornerType, DressingFurnitureType } from '@/lib/types/closet-editor';
import { PRESET_COLORS } from '../editor-context-v2';
import { CornerDownLeft, CornerDownRight, Shirt, Sofa } from 'lucide-react';

const WIDTHS = [600, 800, 900, 1000, 1200];
const PRESET_TYPES: ClosetPresetType[] = ['A', 'B', 'C', 'D', 'E', 'F'];

type PaletteTab = 'closet' | 'furniture';

interface PresetCardProps {
  presetType: ClosetPresetType;
  width: number;
  cornerType?: CornerType;
}

// 드레스룸 가구 카드
function FurnitureCard({ preset }: { preset: DressingFurniturePreset }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        furniturePreset: preset.id,
        furnitureType: preset.furnitureType,
        width: preset.preset_data.width,
        height: preset.preset_data.height,
        depth: preset.preset_data.depth,
      })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  // 가구 타입별 색상
  const typeColors: Record<DressingFurnitureType, { bg: string; border: string }> = {
    closet_unit: { bg: '#DBEAFE', border: '#3B82F6' },
    drawer_unit: { bg: '#FEE2E2', border: '#EF4444' },
    bedding_unit: { bg: '#FDF2F8', border: '#D946EF' },
    shoe_rack: { bg: '#D1FAE5', border: '#10B981' },
    island: { bg: '#FEF3C7', border: '#F59E0B' },
    mirror: { bg: '#E0E7FF', border: '#6366F1' },
    accessory_box: { bg: '#FCE7F3', border: '#EC4899' },
  };

  const colors = typeColors[preset.furnitureType];

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="cursor-grab rounded-lg border-2 p-2 transition-all hover:scale-[1.02] hover:shadow-md active:cursor-grabbing"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="text-lg">{preset.icon}</span>
        <span className="text-xs font-medium text-slate-700">{preset.name}</span>
      </div>
      <p className="text-[10px] text-slate-500">{preset.description}</p>
      <p className="mt-1 text-[10px] text-slate-400">
        {preset.preset_data.width}×{preset.preset_data.depth}×{preset.preset_data.height}
      </p>
    </div>
  );
}

function PresetCard({ presetType, width, cornerType }: PresetCardProps) {
  const colors = PRESET_COLORS[presetType];

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ presetType, width, cornerType })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex cursor-grab flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all hover:scale-105 hover:shadow-md active:cursor-grabbing"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <div className="flex items-center gap-1">
        <div
          className="flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white"
          style={{ backgroundColor: colors.border }}
        >
          {presetType}
        </div>
        {cornerType && (
          <div className="text-slate-500">
            {cornerType === 'L' ? (
              <CornerDownLeft size={14} />
            ) : (
              <CornerDownRight size={14} />
            )}
          </div>
        )}
      </div>
      <span className="text-xs font-medium text-slate-700">{width}</span>
    </div>
  );
}

export function PresetPalette() {
  const [selectedType, setSelectedType] = useState<ClosetPresetType>('A');
  const [showCorner, setShowCorner] = useState(false);
  const [activeTab, setActiveTab] = useState<PaletteTab>('closet');
  const [selectedFurnitureType, setSelectedFurnitureType] = useState<DressingFurnitureType | 'all'>('all');

  // 선택된 가구 타입에 따른 필터링
  const filteredFurniture = selectedFurnitureType === 'all'
    ? DRESSING_FURNITURE_PRESETS
    : DRESSING_FURNITURE_PRESETS.filter((p) => p.furnitureType === selectedFurnitureType);

  return (
    <div className="flex h-full flex-col">
      {/* Tab selector */}
      <div className="mb-3 flex gap-1 rounded-lg bg-slate-100 p-1">
        <button
          onClick={() => setActiveTab('closet')}
          className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium transition-all ${
            activeTab === 'closet'
              ? 'bg-white text-slate-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shirt size={12} />
          옷장 유닛
        </button>
        <button
          onClick={() => setActiveTab('furniture')}
          className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium transition-all ${
            activeTab === 'furniture'
              ? 'bg-white text-slate-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sofa size={12} />
          드레스룸 가구
        </button>
      </div>

      {activeTab === 'furniture' ? (
        /* ── 드레스룸 가구 탭 ─────────────────────────── */
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* 가구 타입 필터 */}
          <div className="mb-2 flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedFurnitureType('all')}
              className={`rounded-full px-2 py-1 text-[10px] font-medium transition-all ${
                selectedFurnitureType === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              전체
            </button>
            {(Object.keys(FURNITURE_TYPE_INFO) as DressingFurnitureType[])
              .filter((t) => t !== 'closet_unit')
              .map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedFurnitureType(type)}
                  className={`rounded-full px-2 py-1 text-[10px] font-medium transition-all ${
                    selectedFurnitureType === type
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {FURNITURE_TYPE_INFO[type].icon} {FURNITURE_TYPE_INFO[type].label}
                </button>
              ))}
          </div>

          {/* 가구 목록 */}
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {filteredFurniture.map((preset) => (
              <FurnitureCard key={preset.id} preset={preset} />
            ))}
          </div>

          <p className="mt-2 text-center text-xs text-slate-400">
            드래그하여 캔버스에 배치
          </p>
        </div>
      ) : (
        /* ── 옷장 유닛 탭 ─────────────────────────────── */
        <>
          {/* Type selector */}
          <div className="mb-3 grid grid-cols-6 gap-1">
        {PRESET_TYPES.map((type) => {
          const colors = PRESET_COLORS[type];
          const isSelected = selectedType === type;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`rounded-md py-1.5 text-xs font-bold transition-all ${
                isSelected ? 'ring-2 ring-offset-1' : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: colors.bg,
                color: colors.border,
                // @ts-expect-error CSS custom property for ring color
                '--tw-ring-color': colors.border,
              }}
            >
              {type}
            </button>
          );
        })}
      </div>

      {/* Type description */}
      <p className="mb-3 text-xs text-slate-500">
        {PRESET_TYPE_INFO[selectedType].description}
      </p>

      {/* Corner toggle */}
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => setShowCorner(false)}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
            !showCorner
              ? 'bg-slate-700 text-white'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          일반
        </button>
        <button
          onClick={() => setShowCorner(true)}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
            showCorner
              ? 'bg-slate-700 text-white'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          코너
        </button>
      </div>

      {/* Width cards */}
      {!showCorner ? (
        <div className="grid grid-cols-3 gap-2">
          {WIDTHS.map((width) => (
            <PresetCard key={width} presetType={selectedType} width={width} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* ㄱ자 코너 */}
          <div>
            <p className="mb-2 flex items-center gap-1 text-xs font-medium text-slate-600">
              <CornerDownLeft size={12} />
              ㄱ자 코너
            </p>
            <div className="grid grid-cols-3 gap-2">
              {WIDTHS.slice(0, 3).map((width) => (
                <PresetCard
                  key={`L-${width}`}
                  presetType={selectedType}
                  width={width}
                  cornerType="L"
                />
              ))}
            </div>
          </div>

          {/* ㄴ자 코너 */}
          <div>
            <p className="mb-2 flex items-center gap-1 text-xs font-medium text-slate-600">
              <CornerDownRight size={12} />
              ㄴ자 코너
            </p>
            <div className="grid grid-cols-3 gap-2">
              {WIDTHS.slice(0, 3).map((width) => (
                <PresetCard
                  key={`R-${width}`}
                  presetType={selectedType}
                  width={width}
                  cornerType="R"
                />
              ))}
            </div>
          </div>
        </div>
      )}

          {/* Usage hint */}
          <p className="mt-4 text-center text-xs text-slate-400">
            드래그하여 캔버스에 배치
          </p>
        </>
      )}
    </div>
  );
}
