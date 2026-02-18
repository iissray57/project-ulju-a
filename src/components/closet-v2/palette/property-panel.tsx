'use client';

import { useEditorV2, PRESET_COLORS, type DoorWall } from '../editor-context-v2';
import { PRESET_TYPE_INFO } from '@/lib/data/system-presets';
import { Trash2, FlipHorizontal2, Grid3X3, RotateCw, DoorOpen } from 'lucide-react';

// 문 설정 패널
function DoorPropertyPanel() {
  const { state, dispatch } = useEditorV2();
  const { door, roomWidth, roomDepth } = state;

  const walls: { value: DoorWall; label: string }[] = [
    { value: 'left', label: '좌측 벽' },
    { value: 'top', label: '상단 벽' },
    { value: 'right', label: '우측 벽' },
    { value: 'bottom', label: '하단 벽' },
  ];

  const maxOffset = (door.wall === 'left' || door.wall === 'right')
    ? roomDepth - door.width
    : roomWidth - door.width;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-slate-700">출입문 설정</h3>

      {/* 벽 선택 */}
      <div className="rounded-lg bg-slate-50 p-3">
        <div className="mb-2 flex items-center gap-2">
          <DoorOpen size={14} className="text-slate-500" />
          <p className="text-xs font-medium text-slate-500">문 위치</p>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {walls.map((w) => (
            <button
              key={w.value}
              onClick={() => dispatch({ type: 'UPDATE_DOOR', payload: { wall: w.value, offset: 0 } })}
              className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                door.wall === w.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-slate-600 hover:bg-blue-50'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* 위치 조절 */}
      <div className="rounded-lg bg-slate-50 p-3">
        <p className="mb-2 text-xs font-medium text-slate-500">벽 내 위치</p>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={maxOffset}
            step={50}
            value={door.offset}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_DOOR', payload: { offset: parseInt(e.target.value, 10) } })
            }
            className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200"
          />
          <span className="w-16 text-right text-xs font-medium text-slate-600">
            {door.offset}mm
          </span>
        </div>
      </div>

      {/* 문 너비 */}
      <div className="rounded-lg bg-slate-50 p-3">
        <p className="mb-2 text-xs font-medium text-slate-500">문 너비</p>
        <div className="grid grid-cols-3 gap-1">
          {[800, 900, 1000].map((w) => (
            <button
              key={w}
              onClick={() => dispatch({ type: 'UPDATE_DOOR', payload: { width: w } })}
              className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                door.width === w
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-slate-600 hover:bg-blue-50'
              }`}
            >
              {w}mm
            </button>
          ))}
        </div>
      </div>

      {/* 열림 방향 */}
      <div className="rounded-lg bg-slate-50 p-3">
        <p className="mb-2 text-xs font-medium text-slate-500">열림 방향</p>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => dispatch({ type: 'UPDATE_DOOR', payload: { openDirection: 'inward' } })}
            className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
              door.openDirection === 'inward'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-slate-600 hover:bg-blue-50'
            }`}
          >
            안쪽
          </button>
          <button
            onClick={() => dispatch({ type: 'UPDATE_DOOR', payload: { openDirection: 'outward' } })}
            className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
              door.openDirection === 'outward'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-slate-600 hover:bg-blue-50'
            }`}
          >
            바깥쪽
          </button>
        </div>
      </div>

      {/* 열림 상태 */}
      <button
        onClick={() => dispatch({ type: 'UPDATE_DOOR', payload: { isOpen: !door.isOpen } })}
        className={`rounded-lg border py-2 text-sm transition-colors ${
          door.isOpen
            ? 'border-blue-300 bg-blue-50 text-blue-600'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
        }`}
      >
        {door.isOpen ? '🚪 문 열림' : '🚪 문 닫힘'}
      </button>

      {/* 선택 해제 */}
      <button
        onClick={() => dispatch({ type: 'SELECT_DOOR', payload: false })}
        className="rounded-lg border border-slate-200 bg-white py-2 text-sm text-slate-500 transition-colors hover:bg-slate-50"
      >
        선택 해제
      </button>
    </div>
  );
}

export function PropertyPanel() {
  const { state, dispatch } = useEditorV2();
  const { selectedId, components, gridSize, doorSelected } = state;

  const selected = components.find((c) => c.id === selectedId);

  // 문이 선택된 경우 문 설정 패널 표시
  if (doorSelected) {
    return <DoorPropertyPanel />;
  }

  // 그리드 사이즈 UI (항상 표시)
  const GridSizeControl = () => (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Grid3X3 size={14} className="text-slate-500" />
        <p className="text-xs font-medium text-slate-500">그리드 크기</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={10}
          max={200}
          step={10}
          value={gridSize}
          onChange={(e) =>
            dispatch({ type: 'SET_GRID_SIZE', payload: parseInt(e.target.value, 10) })
          }
          className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200"
        />
        <span className="w-14 text-right text-xs font-medium text-slate-600">
          {gridSize}mm
        </span>
      </div>
    </div>
  );

  if (!selected) {
    return (
      <div className="flex h-full flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-700">설정</h3>
        <GridSizeControl />
        <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
          컴포넌트를 선택하세요
        </div>
      </div>
    );
  }

  const colors = selected.presetType
    ? PRESET_COLORS[selected.presetType]
    : { bg: '#f1f5f9', border: '#64748b' };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_COMPONENT', payload: selected.id });
  };

  const handlePositionChange = (axis: 'x' | 'z', value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;

    const newPosition: [number, number, number] = [...selected.position];
    if (axis === 'x') newPosition[0] = num;
    if (axis === 'z') newPosition[2] = num;

    dispatch({
      type: 'UPDATE_COMPONENT',
      payload: { id: selected.id, updates: { position: newPosition } },
    });
  };

  const handleDimensionChange = (dim: 'width' | 'depth', value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 100) return;

    dispatch({
      type: 'UPDATE_COMPONENT',
      payload: {
        id: selected.id,
        updates: {
          dimensions: { ...selected.dimensions, [dim]: num },
        },
      },
    });
  };

  const handleMirror = () => {
    dispatch({
      type: 'UPDATE_COMPONENT',
      payload: {
        id: selected.id,
        updates: { mirrored: !selected.mirrored },
      },
    });
  };

  const handleRotate = (angle: number) => {
    const newRotation: [number, number, number] = [0, angle, 0];
    dispatch({
      type: 'UPDATE_COMPONENT',
      payload: {
        id: selected.id,
        updates: { rotation: newRotation },
      },
    });
  };

  // 현재 회전 각도 (degree)
  const currentRotation = Math.round((selected.rotation[1] * 180) / Math.PI) || 0;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-slate-700">속성</h3>

      <GridSizeControl />

      {/* Type badge */}
      {selected.presetType && (
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: colors.border }}
          >
            {selected.presetType}
          </div>
          <div>
            <p className="text-sm font-medium">
              {selected.name}
              {selected.mirrored && (
                <span className="ml-1 text-xs text-blue-500">(반전)</span>
              )}
            </p>
            <p className="text-xs text-slate-500">
              {PRESET_TYPE_INFO[selected.presetType].description}
            </p>
          </div>
        </div>
      )}

      {/* Dimensions (editable) */}
      <div className="rounded-lg bg-slate-50 p-3">
        <p className="mb-2 text-xs font-medium text-slate-500">크기 (mm)</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400">가로</label>
            <input
              type="number"
              value={selected.dimensions.width}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
              step={50}
              min={100}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">깊이</label>
            <input
              type="number"
              value={selected.dimensions.depth}
              onChange={(e) => handleDimensionChange('depth', e.target.value)}
              className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
              step={50}
              min={100}
            />
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-slate-400">
          높이: {selected.dimensions.height}mm (고정)
        </p>
      </div>

      {/* Position */}
      <div className="rounded-lg bg-slate-50 p-3">
        <p className="mb-2 text-xs font-medium text-slate-500">위치 (mm)</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400">X</label>
            <input
              type="number"
              value={selected.position[0]}
              onChange={(e) => handlePositionChange('x', e.target.value)}
              className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
              step={50}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Z</label>
            <input
              type="number"
              value={selected.position[2]}
              onChange={(e) => handlePositionChange('z', e.target.value)}
              className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
              step={50}
            />
          </div>
        </div>
      </div>

      {/* Rotation control (only in plan view) */}
      {state.viewMode === 'plan' && (
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <RotateCw size={14} className="text-slate-500" />
            <p className="text-xs font-medium text-slate-500">회전</p>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[0, 90, 180, 270].map((angle) => (
              <button
                key={angle}
                onClick={() => handleRotate((angle * Math.PI) / 180)}
                className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                  currentRotation === angle
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-slate-600 hover:bg-blue-50'
                }`}
              >
                {angle}°
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mirror button (only in plan view) */}
      {state.viewMode === 'plan' && (
        <button
          onClick={handleMirror}
          className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-sm transition-colors ${
            selected.mirrored
              ? 'border-blue-300 bg-blue-50 text-blue-600'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FlipHorizontal2 size={14} />
          좌우 반전
        </button>
      )}

      {/* Corner type indicator */}
      {selected.cornerType && (
        <div className="rounded-lg bg-amber-50 p-3 text-center">
          <p className="text-xs font-medium text-amber-700">
            코너 유닛 ({selected.cornerType === 'L' ? 'ㄱ자' : 'ㄴ자'})
          </p>
        </div>
      )}

      {/* Parts info */}
      {selected.parts && selected.parts.length > 0 && (
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="mb-2 text-xs font-medium text-slate-500">
            내부 부품 ({selected.parts.length}개)
          </p>
          <div className="max-h-32 space-y-1 overflow-y-auto">
            {selected.parts.map((part) => (
              <div
                key={part.id}
                className="flex items-center justify-between rounded bg-white px-2 py-1 text-xs"
              >
                <span className={part.type === 'rod' ? 'text-blue-600' : 'text-slate-600'}>
                  {part.type === 'rod' ? '봉' : '선반'}
                </span>
                <span className="text-slate-400">{part.y}mm</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="mt-auto flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-2 text-sm text-red-600 transition-colors hover:bg-red-100"
      >
        <Trash2 size={14} />
        삭제
      </button>
    </div>
  );
}
