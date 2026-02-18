'use client';

import { useState } from 'react';
import { Check, RotateCw, Trash2, Palette } from 'lucide-react';
import { useRackSim } from '../rack-context';
import { RACK_FRAME_COLORS, type RackFrameColor } from '../types';

const COLOR_KEYS = Object.keys(RACK_FRAME_COLORS) as RackFrameColor[];

export function OperationOverlay() {
  const { selectedItem, dispatch } = useRackSim();
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!selectedItem) return null;

  const handleDeselect = () => {
    dispatch({ type: 'SELECT_ITEM', payload: null });
    setShowColorPicker(false);
  };

  const handleRotate = () => {
    const currentRotation = selectedItem.rotation ?? 0;
    dispatch({
      type: 'UPDATE_ITEM',
      payload: {
        id: selectedItem.id,
        updates: { rotation: (currentRotation + 90) % 360 },
      },
    });
  };

  const handleDelete = () => {
    dispatch({ type: 'REMOVE_ITEM', payload: selectedItem.id });
  };

  const handleColorChange = (hex: string) => {
    dispatch({
      type: 'UPDATE_ITEM',
      payload: { id: selectedItem.id, updates: { color: hex } },
    });
    setShowColorPicker(false);
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
      {/* Color picker popover */}
      {showColorPicker && (
        <div className="flex items-center gap-2 rounded-xl bg-[#333]/95 backdrop-blur-sm border border-[#444] px-3 py-2 shadow-xl">
          {COLOR_KEYS.map((key) => {
            const color = RACK_FRAME_COLORS[key];
            const isActive = selectedItem.color === color.hex;
            return (
              <button
                key={key}
                onClick={() => handleColorChange(color.hex)}
                title={color.name}
                className={`flex flex-col items-center gap-1 rounded-lg p-1.5 transition-colors ${
                  isActive ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <span
                  className={`h-6 w-6 rounded-full border-2 shadow-sm ${
                    isActive ? 'border-orange-400' : 'border-[#555]'
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-[9px] text-slate-400">{color.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Operation buttons */}
      <div className="flex items-center gap-1 rounded-2xl bg-[#333]/90 backdrop-blur-sm border border-[#444] px-3 py-2 shadow-xl">
        {/* Deselect */}
        <OperationButton
          icon={<Check size={16} />}
          label="선택해제"
          onClick={handleDeselect}
          variant="confirm"
        />

        <div className="w-px h-8 bg-[#444] mx-1" />

        {/* Rotate */}
        <OperationButton
          icon={<RotateCw size={16} />}
          label="회전"
          onClick={handleRotate}
        />

        {/* Delete */}
        <OperationButton
          icon={<Trash2 size={16} />}
          label="삭제"
          onClick={handleDelete}
          variant="danger"
        />

        {/* Color */}
        <OperationButton
          icon={<Palette size={16} />}
          label="색상"
          onClick={() => setShowColorPicker((v) => !v)}
          variant={showColorPicker ? 'active' : 'default'}
        />
      </div>
    </div>
  );
}

interface OperationButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'confirm' | 'danger' | 'active';
}

function OperationButton({ icon, label, onClick, variant = 'default' }: OperationButtonProps) {
  const variantClass = {
    default: 'text-slate-300 hover:bg-white/10 hover:text-white',
    confirm: 'text-orange-400 hover:bg-orange-500/20 hover:text-orange-300',
    danger: 'text-red-400 hover:bg-red-500/20 hover:text-red-300',
    active: 'text-orange-400 bg-orange-500/20',
  }[variant];

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-colors ${variantClass}`}
    >
      {icon}
      <span className="text-[9px] font-medium leading-none">{label}</span>
    </button>
  );
}
