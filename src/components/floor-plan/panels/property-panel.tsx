'use client';

import { Lock, Unlock, Trash2 } from 'lucide-react';
import { useFloorPlan } from '../floor-plan-context';
import type { FloorObject } from '../types';

const ROTATIONS = [0, 90, 180, 270] as const;

export function PropertyPanel() {
  const { state, updateObject, removeObject } = useFloorPlan();

  const selectedObject = state.selectedObjectId
    ? (state.objects.find((o) => o.id === state.selectedObjectId) ?? null)
    : null;

  if (!selectedObject) return null;

  function update(updates: Partial<FloorObject>) {
    if (!selectedObject) return;
    updateObject(selectedObject.id, updates);
  }

  function handleDelete() {
    if (!selectedObject) return;
    removeObject(selectedObject.id);
  }

  return (
    <div className="border-t border-gray-200 bg-white flex-shrink-0">
      {/* 헤더 */}
      <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 truncate pr-2">
          {selectedObject.name}
        </h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => update({ locked: !selectedObject.locked })}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title={selectedObject.locked ? '잠금 해제' : '잠금'}
          >
            {selectedObject.locked ? (
              <Lock className="w-3.5 h-3.5 text-orange-500" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>
          <button
            onClick={handleDelete}
            className="p-1 rounded hover:bg-red-50 transition-colors"
            title="삭제"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>

      <div className="px-3 py-2.5 space-y-3">
        {/* 위치 */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">위치 (mm)</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs text-gray-400 block mb-0.5">X</span>
              <input
                type="number"
                value={Math.round(selectedObject.x)}
                step={10}
                disabled={selectedObject.locked}
                onChange={(e) => update({ x: Number(e.target.value) })}
                className="w-full text-xs rounded border border-gray-300 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400 block mb-0.5">Y</span>
              <input
                type="number"
                value={Math.round(selectedObject.y)}
                step={10}
                disabled={selectedObject.locked}
                onChange={(e) => update({ y: Number(e.target.value) })}
                className="w-full text-xs rounded border border-gray-300 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </label>
          </div>
        </div>

        {/* 크기 */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">크기 (mm)</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs text-gray-400 block mb-0.5">가로</span>
              <input
                type="number"
                value={Math.round(selectedObject.width)}
                step={10}
                min={50}
                disabled={selectedObject.locked}
                onChange={(e) => update({ width: Number(e.target.value) })}
                className="w-full text-xs rounded border border-gray-300 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400 block mb-0.5">세로</span>
              <input
                type="number"
                value={Math.round(selectedObject.depth)}
                step={10}
                min={50}
                disabled={selectedObject.locked}
                onChange={(e) => update({ depth: Number(e.target.value) })}
                className="w-full text-xs rounded border border-gray-300 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </label>
          </div>
        </div>

        {/* 높이 */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">높이 (mm)</p>
          <input
            type="number"
            value={Math.round(selectedObject.height)}
            step={50}
            min={100}
            disabled={selectedObject.locked}
            onChange={(e) => update({ height: Number(e.target.value) })}
            className="w-full text-xs rounded border border-gray-300 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>

        {/* 회전 */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">회전</p>
          <div className="flex gap-1">
            {ROTATIONS.map((deg) => (
              <button
                key={deg}
                onClick={() => update({ rotation: deg })}
                disabled={selectedObject.locked}
                className={[
                  'flex-1 py-1.5 text-xs rounded border transition-colors disabled:opacity-40',
                  selectedObject.rotation === deg
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50',
                ].join(' ')}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
