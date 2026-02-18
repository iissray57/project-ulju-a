'use client';

import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';

// 선반 하나
export interface Shelf {
  id: string;
  y: number; // 바닥에서의 높이 (mm)
}

// 수직 기둥 (좌→우 x 위치)
export interface Post {
  id: string;
  x: number; // 왼쪽 끝에서의 위치 (mm)
}

export interface AngleRackState {
  // 전체 치수
  width: number;    // 총 폭 (mm)
  depth: number;    // 깊이 (mm)
  height: number;   // 총 높이 (mm)
  // 구성 요소
  shelves: Shelf[];
  posts: Post[];
  // UI 상태
  selectedShelfId: string | null;
  selectedPostId: string | null;
  // 프레임 옵션
  postSize: number;   // 기둥 단면 크기 (mm), 보통 40
  shelfThickness: number; // 선반 두께 (mm)
  color: 'white' | 'black' | 'silver';
}

let nextId = 1;
function genId() {
  return `item-${nextId++}`;
}

function createDefaultState(): AngleRackState {
  const width = 900;
  const height = 1800;
  return {
    width,
    depth: 450,
    height,
    shelves: [
      { id: genId(), y: 0 },          // 바닥 선반
      { id: genId(), y: 450 },
      { id: genId(), y: 900 },
      { id: genId(), y: 1350 },
      { id: genId(), y: height },      // 최상단
    ],
    posts: [
      { id: genId(), x: 0 },          // 좌측
      { id: genId(), x: width },       // 우측
    ],
    selectedShelfId: null,
    selectedPostId: null,
    postSize: 40,
    shelfThickness: 20,
    color: 'white',
  };
}

type Action =
  | { type: 'SET_DIMENSION'; payload: Partial<Pick<AngleRackState, 'width' | 'depth' | 'height'>> }
  | { type: 'SET_OPTION'; payload: Partial<Pick<AngleRackState, 'postSize' | 'shelfThickness' | 'color'>> }
  | { type: 'ADD_SHELF'; payload: { y: number } }
  | { type: 'REMOVE_SHELF'; payload: { id: string } }
  | { type: 'MOVE_SHELF'; payload: { id: string; y: number } }
  | { type: 'ADD_POST'; payload: { x: number } }
  | { type: 'REMOVE_POST'; payload: { id: string } }
  | { type: 'SELECT_SHELF'; payload: string | null }
  | { type: 'SELECT_POST'; payload: string | null }
  | { type: 'DISTRIBUTE_SHELVES'; payload: { count: number } }
  | { type: 'RESET' };

function reducer(state: AngleRackState, action: Action): AngleRackState {
  switch (action.type) {
    case 'SET_DIMENSION': {
      const next = { ...state, ...action.payload };
      // 폭 변경 시 최우측 기둥 위치 업데이트
      if (action.payload.width !== undefined) {
        next.posts = state.posts.map((p) =>
          p.x === state.width ? { ...p, x: action.payload.width! } : p
        );
      }
      // 높이 변경 시 최상단 선반 위치 업데이트, 넘치는 선반 조정
      if (action.payload.height !== undefined) {
        const h = action.payload.height!;
        next.shelves = state.shelves.map((s) =>
          s.y === state.height ? { ...s, y: h } : s.y > h ? { ...s, y: h } : s
        );
      }
      return next;
    }

    case 'SET_OPTION':
      return { ...state, ...action.payload };

    case 'ADD_SHELF':
      return {
        ...state,
        shelves: [...state.shelves, { id: genId(), y: action.payload.y }].sort((a, b) => a.y - b.y),
      };

    case 'REMOVE_SHELF': {
      // 바닥(y=0)과 최상단은 삭제 불가
      const target = state.shelves.find((s) => s.id === action.payload.id);
      if (!target || target.y === 0 || target.y === state.height) return state;
      return {
        ...state,
        shelves: state.shelves.filter((s) => s.id !== action.payload.id),
        selectedShelfId: state.selectedShelfId === action.payload.id ? null : state.selectedShelfId,
      };
    }

    case 'MOVE_SHELF': {
      const clamped = Math.max(0, Math.min(state.height, action.payload.y));
      return {
        ...state,
        shelves: state.shelves
          .map((s) => (s.id === action.payload.id ? { ...s, y: clamped } : s))
          .sort((a, b) => a.y - b.y),
      };
    }

    case 'ADD_POST': {
      const x = Math.max(0, Math.min(state.width, action.payload.x));
      return {
        ...state,
        posts: [...state.posts, { id: genId(), x }].sort((a, b) => a.x - b.x),
      };
    }

    case 'REMOVE_POST': {
      // 최소 2개(양쪽 끝)는 유지
      if (state.posts.length <= 2) return state;
      const target = state.posts.find((p) => p.id === action.payload.id);
      if (!target || target.x === 0 || target.x === state.width) return state;
      return {
        ...state,
        posts: state.posts.filter((p) => p.id !== action.payload.id),
        selectedPostId: state.selectedPostId === action.payload.id ? null : state.selectedPostId,
      };
    }

    case 'SELECT_SHELF':
      return { ...state, selectedShelfId: action.payload, selectedPostId: null };

    case 'SELECT_POST':
      return { ...state, selectedPostId: action.payload, selectedShelfId: null };

    case 'DISTRIBUTE_SHELVES': {
      const count = action.payload.count;
      if (count < 2) return state;
      const spacing = state.height / (count - 1);
      const shelves: Shelf[] = Array.from({ length: count }, (_, i) => ({
        id: genId(),
        y: Math.round(i * spacing),
      }));
      return { ...state, shelves, selectedShelfId: null };
    }

    case 'RESET':
      return createDefaultState();

    default:
      return state;
  }
}

interface AngleContextType {
  state: AngleRackState;
  dispatch: React.Dispatch<Action>;
  addShelf: (y: number) => void;
  removeShelf: (id: string) => void;
  moveShelf: (id: string, y: number) => void;
  addPost: (x: number) => void;
  removePost: (id: string) => void;
  distributeShelves: (count: number) => void;
}

const AngleContext = createContext<AngleContextType | null>(null);

export function AngleProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createDefaultState);

  const addShelf = useCallback((y: number) => dispatch({ type: 'ADD_SHELF', payload: { y } }), []);
  const removeShelf = useCallback((id: string) => dispatch({ type: 'REMOVE_SHELF', payload: { id } }), []);
  const moveShelf = useCallback((id: string, y: number) => dispatch({ type: 'MOVE_SHELF', payload: { id, y } }), []);
  const addPost = useCallback((x: number) => dispatch({ type: 'ADD_POST', payload: { x } }), []);
  const removePost = useCallback((id: string) => dispatch({ type: 'REMOVE_POST', payload: { id } }), []);
  const distributeShelves = useCallback((count: number) => dispatch({ type: 'DISTRIBUTE_SHELVES', payload: { count } }), []);

  return (
    <AngleContext.Provider value={{ state, dispatch, addShelf, removeShelf, moveShelf, addPost, removePost, distributeShelves }}>
      {children}
    </AngleContext.Provider>
  );
}

export function useAngleModeler() {
  const ctx = useContext(AngleContext);
  if (!ctx) throw new Error('useAngleModeler must be used within AngleProvider');
  return ctx;
}
