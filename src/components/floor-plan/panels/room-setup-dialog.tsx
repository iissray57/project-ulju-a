'use client';

import { useState } from 'react';
import { useFloorPlan } from '../floor-plan-context';
import type { RoomBoundary, Wall } from '../types';

function createRectRoom(width: number, depth: number, thickness: number): RoomBoundary {
  const vertices = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: depth },
    { x: 0, y: depth },
  ];
  const walls: Wall[] = vertices.map((v, i) => ({
    id: `wall-${i}`,
    start: v,
    end: vertices[(i + 1) % vertices.length],
    thickness,
  }));
  return { walls, vertices };
}

export function RoomSetupDialog() {
  const { state, setRoom, setRoomSetupOpen } = useFloorPlan();
  const [width, setWidth] = useState(3000);
  const [depth, setDepth] = useState(2500);
  const [thickness, setThickness] = useState(200);

  if (!state.roomSetupOpen) return null;

  function clamp(value: number): number {
    return Math.max(1000, Math.min(10000, value));
  }

  function handleStart() {
    const room = createRectRoom(clamp(width), clamp(depth), thickness);
    setRoom(room);
    setRoomSetupOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">방 크기 설정</h2>
        <p className="text-sm text-gray-500 mb-5">드레스룸의 실제 크기를 입력하세요 (단위: mm)</p>

        <div className="space-y-4">
          {/* 가로 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              가로 (mm)
            </label>
            <input
              type="number"
              value={width}
              min={1000}
              max={10000}
              step={100}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* 세로 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              세로 (mm)
            </label>
            <input
              type="number"
              value={depth}
              min={1000}
              max={10000}
              step={100}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* 벽 두께 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              벽 두께 (mm)
            </label>
            <input
              type="number"
              value={thickness}
              min={100}
              max={500}
              step={50}
              onChange={(e) => setThickness(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* 미리보기 표시 */}
          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-center">
            <div
              className="border-4 border-gray-400 bg-gray-100"
              style={{
                width: `${Math.round((clamp(width) / 10000) * 200)}px`,
                height: `${Math.round((clamp(depth) / 10000) * 200)}px`,
                minWidth: '40px',
                minHeight: '30px',
              }}
            />
          </div>
          <p className="text-xs text-gray-400 text-center">
            {clamp(width).toLocaleString()} × {clamp(depth).toLocaleString()} mm
          </p>
        </div>

        <button
          onClick={handleStart}
          className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          사각형으로 시작
        </button>
      </div>
    </div>
  );
}
