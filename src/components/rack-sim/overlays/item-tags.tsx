'use client';

import { X } from 'lucide-react';
import { useRackSim } from '../rack-context';
import { RACK_PRODUCTS } from '../data/rack-products';

export function ItemTags() {
  const { state, dispatch } = useRackSim();

  if (state.items.length === 0) return null;

  return (
    <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2 max-w-[60%]">
      {state.items.map((item) => {
        const isSelected = item.id === state.selectedItemId;
        const product = RACK_PRODUCTS[item.productType];
        return (
          <div
            key={item.id}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-all select-none ${
              isSelected
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-white/90 text-slate-800 hover:bg-white shadow-sm'
            }`}
            onClick={() =>
              dispatch({
                type: 'SELECT_ITEM',
                payload: isSelected ? null : item.id,
              })
            }
          >
            <span className="text-sm leading-none">{product.icon}</span>
            <span>{item.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'REMOVE_ITEM', payload: item.id });
              }}
              className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                isSelected
                  ? 'bg-white/20 text-white hover:bg-white/40'
                  : 'bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-500'
              }`}
              aria-label="삭제"
            >
              <X size={10} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
