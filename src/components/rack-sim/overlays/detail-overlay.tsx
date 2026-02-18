'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft, Minus, Plus } from 'lucide-react';
import { useRackSim } from '../rack-context';
import { RACK_SIZE_CONFIGS, findNearestOption } from '../data/rack-sizes';
import { RACK_PRODUCTS } from '../data/rack-products';
import { RACK_OPTIONS } from '../data/rack-options';
import type { RackOptionType } from '../data/rack-options';

// Compact slider for the overlay
interface DimensionSliderProps {
  label: string;
  unit: string;
  value: number;
  options: number[];
  onChange: (v: number) => void;
}

function DimensionSlider({ label, unit, value, options, onChange }: DimensionSliderProps) {
  const min = options[0];
  const max = options[options.length - 1];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span className="text-xs font-bold text-orange-400">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => {
          const nearest = findNearestOption(Number(e.target.value), options);
          onChange(nearest);
        }}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#444] accent-orange-500"
      />
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors ${
              value === opt
                ? 'bg-orange-500 text-white'
                : 'bg-[#3A3A3A] text-slate-400 hover:bg-[#444] hover:text-slate-200'
            }`}
          >
            {opt >= 1000 ? `${opt / 1000}m` : `${opt}`}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DetailOverlay() {
  const { selectedItem, dispatch } = useRackSim();
  const [collapsed, setCollapsed] = useState(false);

  if (!selectedItem) return null;

  const sizeConfig = RACK_SIZE_CONFIGS[selectedItem.productType];
  const product = RACK_PRODUCTS[selectedItem.productType];

  const updateSize = (dimension: 'width' | 'depth' | 'height', value: number) => {
    dispatch({
      type: 'UPDATE_ITEM_SIZE',
      payload: { id: selectedItem.id, [dimension]: value },
    });
  };

  const adjustShelf = (delta: number) => {
    dispatch({
      type: 'SET_SHELF_COUNT',
      payload: { id: selectedItem.id, count: selectedItem.shelfCount + delta },
    });
  };

  // Active non-base options to display as thumbnails
  const activeOptions = RACK_OPTIONS.filter(
    (o) => o.group !== 'base' && selectedItem.options.includes(o.type as RackOptionType),
  );

  if (collapsed) {
    return (
      <div className="absolute right-0 top-0 h-full z-10 flex items-center">
        <button
          onClick={() => setCollapsed(false)}
          className="flex h-20 w-7 items-center justify-center rounded-l-xl bg-[#2A2A2A]/95 border border-r-0 border-[#444] text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute right-0 top-0 h-full z-10 flex">
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(true)}
        className="flex h-20 w-7 self-center items-center justify-center rounded-l-xl bg-[#2A2A2A]/95 border border-r-0 border-[#444] text-slate-400 hover:text-white transition-colors mt-auto mb-auto"
      >
        <ChevronRight size={14} />
      </button>

      {/* Panel */}
      <div className="w-[280px] h-full bg-[#2A2A2A]/95 backdrop-blur-sm border-l border-[#444] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#333] shrink-0">
          <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-widest mb-0.5">상세 설정</p>
          <p className="text-sm font-semibold text-white truncate">{selectedItem.name}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          {/* Section 1: Dimensions */}
          <section>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">크기 설정</p>
            <div className="flex flex-col gap-4">
              <DimensionSlider
                label="가로 (W)"
                unit="mm"
                value={selectedItem.width}
                options={sizeConfig.widthOptions}
                onChange={(v) => updateSize('width', v)}
              />
              <DimensionSlider
                label="세로 (D)"
                unit="mm"
                value={selectedItem.depth}
                options={sizeConfig.depthOptions}
                onChange={(v) => updateSize('depth', v)}
              />
              <DimensionSlider
                label="높이 (H)"
                unit="mm"
                value={selectedItem.height}
                options={sizeConfig.heightOptions}
                onChange={(v) => updateSize('height', v)}
              />
            </div>
          </section>

          <div className="border-t border-[#333]" />

          {/* Section 2: Shelf count */}
          <section>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">선반 수</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => adjustShelf(-1)}
                disabled={selectedItem.shelfCount <= product.minShelfCount}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#444] bg-[#333] text-slate-300 transition-colors hover:bg-[#444] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus size={14} />
              </button>
              <div className="flex-1 text-center">
                <span className="text-xl font-bold text-white">{selectedItem.shelfCount}</span>
                <span className="text-sm text-slate-400 ml-1">단</span>
              </div>
              <button
                onClick={() => adjustShelf(1)}
                disabled={selectedItem.shelfCount >= product.maxShelfCount}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#444] bg-[#333] text-slate-300 transition-colors hover:bg-[#444] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-slate-600">
              최소 {product.minShelfCount}단 / 최대 {product.maxShelfCount}단
            </p>
          </section>

          {/* Section 3: Active options thumbnails */}
          {activeOptions.length > 0 && (
            <>
              <div className="border-t border-[#333]" />
              <section>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">추가 구성품</p>
                <div className="grid grid-cols-3 gap-2">
                  {activeOptions.map((opt) => (
                    <div
                      key={opt.type}
                      className="flex flex-col items-center gap-1 rounded-lg border border-orange-500/40 bg-orange-500/10 p-2"
                    >
                      <span className="text-2xl leading-none">{opt.icon}</span>
                      <span className="text-[9px] text-orange-400 text-center leading-tight">{opt.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
