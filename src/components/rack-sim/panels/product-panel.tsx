'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useRackSim } from '../rack-context';
import { RACK_PRODUCTS, type RackProductType } from '../data/rack-products';
import { RACK_OPTIONS } from '../data/rack-options';
import type { RackOptionType } from '../data/rack-options';

// Product types with display info
const PRODUCT_TYPES: RackProductType[] = ['normal', 'hanger', 'bottom_open', 'washing'];

// Product image placeholders (color-coded bg)
const PRODUCT_COLORS: Record<RackProductType, string> = {
  normal: '#3A3A3A',
  hanger: '#2D3A2A',
  bottom_open: '#2A2D3A',
  washing: '#3A2A2D',
};

// Options for selected item mode (non-base options as add-ons)
const ADDON_OPTIONS: RackOptionType[] = [
  'extra_shelf',
  'hanger_bar',
  'side_safety_bar',
  'front_curtain',
  'side_curtain',
  'mesh_board',
  'leveling_foot',
  'small_wheel',
  'large_wheel',
];

export function ProductPanel() {
  const { dispatch, addRack, selectedItem } = useRackSim();
  const [selectedProductType, setSelectedProductType] = useState<RackProductType | null>(null);

  // If an item is selected => show option add mode
  if (selectedItem) {
    const availableOptions = RACK_OPTIONS.filter((o) => ADDON_OPTIONS.includes(o.type));
    return (
      <div className="flex h-full w-[260px] flex-col bg-[#2A2A2A] border-r border-[#333] shrink-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#333]">
          <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-widest mb-0.5">옵션 추가</p>
          <p className="text-sm font-semibold text-white truncate">{selectedItem.name}</p>
        </div>

        {/* Options list */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {availableOptions.map((opt) => {
            const active = selectedItem.options.includes(opt.type);
            return (
              <button
                key={opt.type}
                onClick={() =>
                  dispatch({
                    type: 'TOGGLE_OPTION',
                    payload: { id: selectedItem.id, option: opt.type },
                  })
                }
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  active
                    ? 'border-orange-500/60 bg-orange-500/10'
                    : 'border-[#444] bg-[#333] hover:border-[#555] hover:bg-[#3A3A3A]'
                }`}
              >
                <span className="text-xl leading-none w-8 text-center">{opt.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold ${active ? 'text-orange-400' : 'text-slate-300'}`}>
                    {opt.name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{opt.description}</p>
                </div>
                <span
                  className={`h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
                    active ? 'border-orange-500 bg-orange-500' : 'border-[#555] bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Deselect button */}
        <div className="p-3 border-t border-[#333]">
          <button
            onClick={() => dispatch({ type: 'SELECT_ITEM', payload: null })}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#444] bg-[#333] py-2 text-xs font-medium text-slate-300 transition-colors hover:border-[#555] hover:bg-[#3A3A3A]"
          >
            <X size={13} />
            선택 해제
          </button>
        </div>
      </div>
    );
  }

  // Default mode: product library
  return (
    <div className="flex h-full w-[260px] flex-col bg-[#2A2A2A] border-r border-[#333] shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#333]">
        <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-widest mb-0.5">라이브러리</p>
        <p className="text-sm font-semibold text-white">앵글 선반 라이브러리</p>
      </div>

      {/* Product list - vertical scroll */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {PRODUCT_TYPES.map((type) => {
          const product = RACK_PRODUCTS[type];
          const isSelected = selectedProductType === type;
          return (
            <button
              key={type}
              onClick={() => setSelectedProductType(isSelected ? null : type)}
              className={`flex flex-col w-full rounded-xl border overflow-hidden text-left transition-all ${
                isSelected
                  ? 'border-orange-500 ring-1 ring-orange-500/50'
                  : 'border-[#444] hover:border-[#666]'
              }`}
            >
              {/* Product image area */}
              <div
                className="w-full h-[100px] flex items-center justify-center"
                style={{ backgroundColor: PRODUCT_COLORS[type] }}
              >
                <span className="text-5xl leading-none">{product.icon}</span>
              </div>
              {/* Product info */}
              <div className={`px-3 py-2 ${isSelected ? 'bg-orange-500/10' : 'bg-[#333]'}`}>
                <p className={`text-xs font-semibold ${isSelected ? 'text-orange-400' : 'text-slate-200'}`}>
                  {product.name}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">{product.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom action buttons - only visible when product is selected */}
      <div className={`border-t border-[#333] transition-all overflow-hidden ${selectedProductType ? 'max-h-24' : 'max-h-0 border-t-0'}`}>
        {selectedProductType && (
          <div className="flex gap-2 p-3">
            <button
              onClick={() => setSelectedProductType(null)}
              className="flex-1 rounded-lg border border-[#444] bg-[#333] py-2 text-xs font-medium text-slate-300 transition-colors hover:border-[#555] hover:bg-[#3A3A3A]"
            >
              취소
            </button>
            <button
              onClick={() => {
                addRack(selectedProductType);
                setSelectedProductType(null);
              }}
              className="flex-1 rounded-lg bg-orange-500 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-600"
            >
              생성
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
