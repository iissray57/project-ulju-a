'use client';

import { Minus, Plus } from 'lucide-react';
import { useRackSim } from '../rack-context';
import { RACK_SIZE_CONFIGS, findNearestOption } from '../data/rack-sizes';
import { RACK_PRODUCTS } from '../data/rack-products';
import { RACK_FRAME_COLORS, type RackFrameColor } from '../types';

const COLOR_KEYS = Object.keys(RACK_FRAME_COLORS) as RackFrameColor[];

interface DimensionSliderProps {
  label: string;
  value: number;
  options: number[];
  onChange: (v: number) => void;
}

function DimensionSlider({ label, value, options, onChange }: DimensionSliderProps) {
  const min = options[0];
  const max = options[options.length - 1];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-600">{label}</p>
        <p className="text-xs font-semibold text-blue-600">{value}mm</p>
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
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-500"
      />
      {/* Quick-select buttons */}
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
              value === opt
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-600'
            }`}
          >
            {opt >= 1000 ? `${opt / 1000}m` : `${opt}`}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SizePanel() {
  const { selectedItem, dispatch } = useRackSim();

  if (!selectedItem) {
    return (
      <div className="flex h-full w-56 flex-col items-center justify-center border-l border-slate-200 bg-white p-4">
        <p className="text-center text-xs text-slate-400">제품을 선택하면 크기를 설정할 수 있습니다</p>
      </div>
    );
  }

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
      payload: {
        id: selectedItem.id,
        count: selectedItem.shelfCount + delta,
      },
    });
  };

  const setColor = (hex: string) => {
    dispatch({
      type: 'UPDATE_ITEM',
      payload: { id: selectedItem.id, updates: { color: hex } },
    });
  };

  return (
    <div className="flex h-full w-56 flex-col gap-4 overflow-y-auto border-l border-slate-200 bg-white p-3">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">크기 설정</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-700">{selectedItem.name}</p>
      </div>

      {/* Dimensions */}
      <div className="flex flex-col gap-4">
        <DimensionSlider
          label="가로 (W)"
          value={selectedItem.width}
          options={sizeConfig.widthOptions}
          onChange={(v) => updateSize('width', v)}
        />
        <DimensionSlider
          label="세로 (D)"
          value={selectedItem.depth}
          options={sizeConfig.depthOptions}
          onChange={(v) => updateSize('depth', v)}
        />
        <DimensionSlider
          label="높이 (H)"
          value={selectedItem.height}
          options={sizeConfig.heightOptions}
          onChange={(v) => updateSize('height', v)}
        />
      </div>

      {/* 구분선 */}
      <div className="border-t border-slate-200" />

      {/* 선반 수 */}
      <div>
        <p className="mb-2 text-xs font-medium text-slate-600">선반 수</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => adjustShelf(-1)}
            disabled={selectedItem.shelfCount <= product.minShelfCount}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30"
          >
            <Minus size={13} />
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-slate-700">
            {selectedItem.shelfCount}단
          </span>
          <button
            onClick={() => adjustShelf(1)}
            disabled={selectedItem.shelfCount >= product.maxShelfCount}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30"
          >
            <Plus size={13} />
          </button>
        </div>
        <p className="mt-1 text-center text-[10px] text-slate-400">
          최소 {product.minShelfCount}단 / 최대 {product.maxShelfCount}단
        </p>
      </div>

      {/* 구분선 */}
      <div className="border-t border-slate-200" />

      {/* 프레임 색상 */}
      <div>
        <p className="mb-2 text-xs font-medium text-slate-600">프레임 색상</p>
        <div className="grid grid-cols-2 gap-1.5">
          {COLOR_KEYS.map((key) => {
            const color = RACK_FRAME_COLORS[key];
            const isSelected = selectedItem.color === color.hex;
            return (
              <button
                key={key}
                onClick={() => setColor(color.hex)}
                className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-left transition-colors ${
                  isSelected
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-300 shadow-sm"
                  style={{ backgroundColor: color.hex }}
                />
                <span
                  className={`text-[11px] font-medium ${
                    isSelected ? 'text-blue-700' : 'text-slate-600'
                  }`}
                >
                  {color.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
