'use client';

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  useCallback,
  useMemo,
} from 'react';
import type {
  ClosetComponent,
  ClosetPresetType,
  CornerType,
  ViewMode,
  UnitPart,
  DressingFurnitureType,
} from '@/lib/types/closet-editor';
import { SYSTEM_PRESETS, DRESSING_FURNITURE_PRESETS } from '@/lib/data/system-presets';

// ── 프리셋 색상 (파스텔톤) ─────────────────────────────────────────
export const PRESET_COLORS: Record<ClosetPresetType, { bg: string; border: string }> = {
  A: { bg: '#DBEAFE', border: '#3B82F6' },
  B: { bg: '#D1FAE5', border: '#10B981' },
  C: { bg: '#FEF3C7', border: '#F59E0B' },
  D: { bg: '#FCE7F3', border: '#EC4899' },
  E: { bg: '#E0E7FF', border: '#6366F1' },
  F: { bg: '#F3E8FF', border: '#A855F7' },
};

// ── 스케일 설정 ────────────────────────────────────────────────────
export const SCALE = {
  MM_TO_PX: 0.15, // 1mm = 0.15px
  GRID_SIZE: 50,  // mm
};

// ── 마그네틱 스냅 설정 ─────────────────────────────────────────────
export const MAGNETIC_SNAP = {
  THRESHOLD: 30, // 30mm 이내면 자동 연결
  ENABLED: true,
};

// ── 바닥 패턴 옵션 ─────────────────────────────────────────────────
export type FloorPattern = 'light-wood' | 'dark-wood' | 'herringbone' | 'marble' | 'concrete';

export const FLOOR_PATTERNS: Record<FloorPattern, { name: string; color: string; lineColor: string }> = {
  'light-wood': { name: '밝은 원목', color: '#e8dcc8', lineColor: '#d4c4a8' },
  'dark-wood': { name: '월넛', color: '#8b7355', lineColor: '#6b5344' },
  'herringbone': { name: '헤링본', color: '#d4c4a8', lineColor: '#b8a888' },
  'marble': { name: '대리석', color: '#f0f0f0', lineColor: '#e0e0e0' },
  'concrete': { name: '콘크리트', color: '#c0c0c0', lineColor: '#a8a8a8' },
};

// ── 문 위치 타입 ─────────────────────────────────────────────────────
export type DoorWall = 'left' | 'top' | 'right' | 'bottom';

export interface DoorPosition {
  wall: DoorWall;        // 문이 있는 벽
  offset: number;        // 벽 시작점에서의 거리 (mm)
  width: number;         // 문 너비 (mm)
  isOpen: boolean;       // 문 열림 상태
  openDirection: 'inward' | 'outward'; // 열림 방향
}

// ── 상태 타입 ──────────────────────────────────────────────────────
export interface EditorStateV2 {
  viewMode: ViewMode;
  components: ClosetComponent[];
  selectedId: string | null;
  gridSize: number;
  snapEnabled: boolean;
  showDimensions: boolean;
  showGrid: boolean;
  zoom: number;
  panOffset: { x: number; y: number };
  roomWidth: number;  // mm
  roomDepth: number;  // mm
  floorPattern: FloorPattern;  // 바닥 패턴
  door: DoorPosition;  // 방 출입문
  doorSelected: boolean; // 문 선택 상태
  history: ClosetComponent[][];
  historyIndex: number;
}

const DEFAULT_STATE: EditorStateV2 = {
  viewMode: 'plan',
  components: [],
  selectedId: null,
  gridSize: 50,
  snapEnabled: true,
  showDimensions: true,
  showGrid: true,
  zoom: 1,
  panOffset: { x: 50, y: 50 },
  roomWidth: 4000,
  roomDepth: 2400,
  floorPattern: 'light-wood',
  door: {
    wall: 'right',
    offset: 1200, // 벽 중앙 근처
    width: 900,
    isOpen: true,
    openDirection: 'inward',
  },
  doorSelected: false,
  history: [[]],
  historyIndex: 0,
};

// ── 액션 타입 ──────────────────────────────────────────────────────
type Action =
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'ADD_COMPONENT'; payload: ClosetComponent }
  | { type: 'UPDATE_COMPONENT'; payload: { id: string; updates: Partial<ClosetComponent> } }
  | { type: 'DELETE_COMPONENT'; payload: string }
  | { type: 'SELECT_COMPONENT'; payload: string | null }
  | { type: 'SET_SNAP'; payload: boolean }
  | { type: 'SET_SHOW_GRID'; payload: boolean }
  | { type: 'SET_SHOW_DIMENSIONS'; payload: boolean }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_PAN_OFFSET'; payload: { x: number; y: number } }
  | { type: 'SET_ROOM_SIZE'; payload: { width: number; depth: number } }
  | { type: 'ADD_PART_TO_UNIT'; payload: { unitId: string; part: UnitPart } }
  | { type: 'UPDATE_PART'; payload: { unitId: string; partId: string; updates: Partial<UnitPart> } }
  | { type: 'DELETE_PART'; payload: { unitId: string; partId: string } }
  | { type: 'SET_GRID_SIZE'; payload: number }
  | { type: 'SET_FLOOR_PATTERN'; payload: FloorPattern }
  | { type: 'UPDATE_DOOR'; payload: Partial<DoorPosition> }
  | { type: 'SELECT_DOOR'; payload: boolean }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD_STATE'; payload: ClosetComponent[] };

// ── 리듀서 ─────────────────────────────────────────────────────────
function editorReducer(state: EditorStateV2, action: Action): EditorStateV2 {
  switch (action.type) {
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload, selectedId: null };

    case 'ADD_COMPONENT': {
      const newComponents = [...state.components, action.payload];
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newComponents);
      return {
        ...state,
        components: newComponents,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case 'UPDATE_COMPONENT': {
      const newComponents = state.components.map((c) =>
        c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
      );
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newComponents);
      return {
        ...state,
        components: newComponents,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case 'DELETE_COMPONENT': {
      const newComponents = state.components.filter((c) => c.id !== action.payload);
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newComponents);
      return {
        ...state,
        components: newComponents,
        selectedId: state.selectedId === action.payload ? null : state.selectedId,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case 'SELECT_COMPONENT':
      return { ...state, selectedId: action.payload };

    case 'SET_SNAP':
      return { ...state, snapEnabled: action.payload };

    case 'SET_SHOW_GRID':
      return { ...state, showGrid: action.payload };

    case 'SET_SHOW_DIMENSIONS':
      return { ...state, showDimensions: action.payload };

    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.2, Math.min(3, action.payload)) };

    case 'SET_PAN_OFFSET':
      return { ...state, panOffset: action.payload };

    case 'SET_ROOM_SIZE':
      return { ...state, roomWidth: action.payload.width, roomDepth: action.payload.depth };

    case 'SET_GRID_SIZE':
      return { ...state, gridSize: Math.max(10, Math.min(200, action.payload)) };

    case 'SET_FLOOR_PATTERN':
      return { ...state, floorPattern: action.payload };

    case 'UPDATE_DOOR':
      return { ...state, door: { ...state.door, ...action.payload } };

    case 'SELECT_DOOR':
      return { ...state, doorSelected: action.payload, selectedId: action.payload ? null : state.selectedId };

    case 'ADD_PART_TO_UNIT': {
      const newComponents = state.components.map((c) => {
        if (c.id === action.payload.unitId) {
          return { ...c, parts: [...(c.parts || []), action.payload.part] };
        }
        return c;
      });
      return { ...state, components: newComponents };
    }

    case 'UPDATE_PART': {
      const newComponents = state.components.map((c) => {
        if (c.id === action.payload.unitId) {
          return {
            ...c,
            parts: (c.parts || []).map((p) =>
              p.id === action.payload.partId ? { ...p, ...action.payload.updates } : p
            ),
          };
        }
        return c;
      });
      return { ...state, components: newComponents };
    }

    case 'DELETE_PART': {
      const newComponents = state.components.map((c) => {
        if (c.id === action.payload.unitId) {
          return {
            ...c,
            parts: (c.parts || []).filter((p) => p.id !== action.payload.partId),
          };
        }
        return c;
      });
      return { ...state, components: newComponents };
    }

    case 'UNDO':
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return {
          ...state,
          components: state.history[newIndex],
          historyIndex: newIndex,
          selectedId: null,
        };
      }
      return state;

    case 'REDO':
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return {
          ...state,
          components: state.history[newIndex],
          historyIndex: newIndex,
          selectedId: null,
        };
      }
      return state;

    case 'LOAD_STATE': {
      return {
        ...state,
        components: action.payload,
        history: [action.payload],
        historyIndex: 0,
        selectedId: null,
      };
    }

    default:
      return state;
  }
}

// ── 마그네틱 스냅 결과 타입 ────────────────────────────────────────
export interface MagneticSnapResult {
  x: number;
  z: number;
  snappedToWall: { left: boolean; top: boolean; right: boolean; bottom: boolean };
  snappedToComponent: string | null; // 스냅된 컴포넌트 ID
}

// ── 컨텍스트 ───────────────────────────────────────────────────────
interface EditorContextValue {
  state: EditorStateV2;
  dispatch: React.Dispatch<Action>;
  // Helper functions
  addComponentFromPreset: (presetType: ClosetPresetType, width: number, x: number, z: number, cornerType?: CornerType) => void;
  addFurnitureFromPreset: (furniturePresetId: string, x: number, z: number) => void;
  snapToGrid: (value: number) => number;
  magneticSnap: (currentId: string, x: number, z: number, width: number, depth: number) => MagneticSnapResult;
  mmToPx: (mm: number) => number;
  pxToMm: (px: number) => number;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProviderV2({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, DEFAULT_STATE);

  const mmToPx = useCallback((mm: number) => mm * SCALE.MM_TO_PX * state.zoom, [state.zoom]);
  const pxToMm = useCallback((px: number) => px / SCALE.MM_TO_PX / state.zoom, [state.zoom]);

  const snapToGrid = useCallback(
    (value: number) => {
      if (!state.snapEnabled) return value;
      return Math.round(value / state.gridSize) * state.gridSize;
    },
    [state.snapEnabled, state.gridSize]
  );

  // 마그네틱 스냅: 벽과 인접 객체에 자동 연결
  const magneticSnap = useCallback(
    (currentId: string, x: number, z: number, width: number, depth: number): MagneticSnapResult => {
      const threshold = MAGNETIC_SNAP.THRESHOLD;
      let snappedX = x;
      let snappedZ = z;
      const snappedToWall = { left: false, top: false, right: false, bottom: false };
      let snappedToComponent: string | null = null;

      // 현재 객체의 경계
      const left = x;
      const right = x + width;
      const top = z;
      const bottom = z + depth;

      // 1. 벽 스냅
      // 좌측 벽 (x=0)
      if (left < threshold) {
        snappedX = 0;
        snappedToWall.left = true;
      }
      // 상단 벽 (z=0)
      if (top < threshold) {
        snappedZ = 0;
        snappedToWall.top = true;
      }
      // 우측 벽
      if (state.roomWidth - right < threshold) {
        snappedX = state.roomWidth - width;
        snappedToWall.right = true;
      }
      // 하단 벽
      if (state.roomDepth - bottom < threshold) {
        snappedZ = state.roomDepth - depth;
        snappedToWall.bottom = true;
      }

      // 2. 다른 컴포넌트와 스냅
      for (const comp of state.components) {
        if (comp.id === currentId) continue;

        const compLeft = comp.position[0];
        const compRight = comp.position[0] + comp.dimensions.width;
        const compTop = comp.position[2];
        const compBottom = comp.position[2] + comp.dimensions.depth;

        // Z축이 겹치는 범위에 있을 때만 X축 스냅 검사
        const zOverlap = !(bottom < compTop || top > compBottom);
        // X축이 겹치는 범위에 있을 때만 Z축 스냅 검사
        const xOverlap = !(right < compLeft || left > compRight);

        if (zOverlap) {
          // 현재 객체 좌측 → 다른 객체 우측에 스냅
          if (Math.abs(left - compRight) < threshold) {
            snappedX = compRight;
            snappedToComponent = comp.id;
          }
          // 현재 객체 우측 → 다른 객체 좌측에 스냅
          if (Math.abs(right - compLeft) < threshold) {
            snappedX = compLeft - width;
            snappedToComponent = comp.id;
          }
        }

        if (xOverlap) {
          // 현재 객체 상단 → 다른 객체 하단에 스냅
          if (Math.abs(top - compBottom) < threshold) {
            snappedZ = compBottom;
            snappedToComponent = comp.id;
          }
          // 현재 객체 하단 → 다른 객체 상단에 스냅
          if (Math.abs(bottom - compTop) < threshold) {
            snappedZ = compTop - depth;
            snappedToComponent = comp.id;
          }
        }

        // 깊이 정렬 (같은 깊이로 맞추기)
        if (Math.abs(compTop - top) < threshold && xOverlap) {
          snappedZ = compTop;
        }
        if (Math.abs(compBottom - bottom) < threshold && xOverlap) {
          snappedZ = compBottom - depth;
        }
      }

      return { x: snappedX, z: snappedZ, snappedToWall, snappedToComponent };
    },
    [state.components, state.roomWidth, state.roomDepth]
  );

  const addComponentFromPreset = useCallback(
    (presetType: ClosetPresetType, width: number, x: number, z: number, cornerType?: CornerType) => {
      const preset = SYSTEM_PRESETS.find(
        (p) => p.presetType === presetType && p.preset_data.width === width
      );
      if (!preset) return;

      const snappedX = snapToGrid(x);
      const snappedZ = snapToGrid(z);

      // 코너 유닛은 깊이를 400mm로 고정
      const componentDepth = cornerType ? 400 : preset.preset_data.depth;

      const component: ClosetComponent = {
        id: `unit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        presetType,
        cornerType,
        name: cornerType ? `${preset.name} (${cornerType === 'L' ? 'ㄱ자' : 'ㄴ자'})` : preset.name,
        shapeType: cornerType ? 'rounded-rect' : 'rect',
        position: [snappedX, 0, snappedZ],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        dimensions: {
          width: preset.preset_data.width,
          height: preset.preset_data.height,
          depth: componentDepth,
        },
        color: PRESET_COLORS[presetType].bg,
        borderColor: PRESET_COLORS[presetType].border,
        borderRadius: cornerType ? 60 : undefined,  // 코너 안쪽 둥글기 (mm)
        locked: false,
        mirrored: false,
        parts: preset.preset_data.parts,
      };

      dispatch({ type: 'ADD_COMPONENT', payload: component });
    },
    [snapToGrid]
  );

  // 드레스룸 가구 추가
  const addFurnitureFromPreset = useCallback(
    (furniturePresetId: string, x: number, z: number) => {
      const preset = DRESSING_FURNITURE_PRESETS.find((p) => p.id === furniturePresetId);
      if (!preset) return;

      const snappedX = snapToGrid(x);
      const snappedZ = snapToGrid(z);

      // 가구 타입별 색상
      const furnitureColors: Record<DressingFurnitureType, { bg: string; border: string }> = {
        closet_unit: { bg: '#DBEAFE', border: '#3B82F6' },
        drawer_unit: { bg: '#FEE2E2', border: '#EF4444' },
        shoe_rack: { bg: '#D1FAE5', border: '#10B981' },
        island: { bg: '#FEF3C7', border: '#F59E0B' },
        mirror: { bg: '#E0E7FF', border: '#6366F1' },
        accessory_box: { bg: '#FCE7F3', border: '#EC4899' },
      };

      const colors = furnitureColors[preset.furnitureType];

      const component: ClosetComponent = {
        id: `furniture-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        furnitureType: preset.furnitureType,
        name: preset.name,
        shapeType: 'rect',
        position: [snappedX, 0, snappedZ],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        dimensions: {
          width: preset.preset_data.width,
          height: preset.preset_data.height,
          depth: preset.preset_data.depth,
        },
        color: colors.bg,
        borderColor: colors.border,
        locked: false,
        mirrored: false,
        parts: preset.preset_data.parts,
      };

      dispatch({ type: 'ADD_COMPONENT', payload: component });
    },
    [snapToGrid]
  );

  const value = useMemo(
    () => ({
      state,
      dispatch,
      addComponentFromPreset,
      addFurnitureFromPreset,
      snapToGrid,
      magneticSnap,
      mmToPx,
      pxToMm,
    }),
    [state, addComponentFromPreset, addFurnitureFromPreset, snapToGrid, magneticSnap, mmToPx, pxToMm]
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditorV2() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorV2 must be used within EditorProviderV2');
  }
  return context;
}
