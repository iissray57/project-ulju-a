'use client';

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import {
  DEFAULT_EDITOR_STATE,
  type ClosetComponent,
  type EditorState,
} from '@/lib/types/closet-editor';

// ── Actions ──────────────────────────────────────────────

type EditorAction =
  | { type: 'ADD_COMPONENT'; payload: ClosetComponent }
  | { type: 'REMOVE_COMPONENT'; payload: string }
  | { type: 'UPDATE_COMPONENT'; payload: { id: string; changes: Partial<ClosetComponent> } }
  | { type: 'SELECT_COMPONENT'; payload: string | null }
  | { type: 'SET_CAMERA_MODE'; payload: '2d' | '3d' }
  | { type: 'SET_GRID_SIZE'; payload: number }
  | { type: 'TOGGLE_SNAP' }
  | { type: 'TOGGLE_DIMENSIONS' }
  | { type: 'LOAD_STATE'; payload: EditorState }
  | { type: 'CLEAR_ALL' };

// ── Reducer ──────────────────────────────────────────────

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'ADD_COMPONENT':
      return {
        ...state,
        components: [...state.components, action.payload],
        selectedId: action.payload.id,
      };

    case 'REMOVE_COMPONENT':
      return {
        ...state,
        components: state.components.filter((c) => c.id !== action.payload),
        selectedId: state.selectedId === action.payload ? null : state.selectedId,
      };

    case 'UPDATE_COMPONENT':
      return {
        ...state,
        components: state.components.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload.changes } : c
        ),
      };

    case 'SELECT_COMPONENT':
      return { ...state, selectedId: action.payload };

    case 'SET_CAMERA_MODE':
      return { ...state, cameraMode: action.payload };

    case 'SET_GRID_SIZE':
      return { ...state, gridSize: action.payload };

    case 'TOGGLE_SNAP':
      return { ...state, snapEnabled: !state.snapEnabled };

    case 'TOGGLE_DIMENSIONS':
      return { ...state, showDimensions: !state.showDimensions };

    case 'LOAD_STATE':
      return action.payload;

    case 'CLEAR_ALL':
      return { ...DEFAULT_EDITOR_STATE };

    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────

const EditorStateContext = createContext<EditorState | null>(null);
const EditorDispatchContext = createContext<Dispatch<EditorAction> | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, DEFAULT_EDITOR_STATE);

  return (
    <EditorStateContext.Provider value={state}>
      <EditorDispatchContext.Provider value={dispatch}>
        {children}
      </EditorDispatchContext.Provider>
    </EditorStateContext.Provider>
  );
}

export function useEditorState(): EditorState {
  const ctx = useContext(EditorStateContext);
  if (!ctx) throw new Error('useEditorState must be used inside EditorProvider');
  return ctx;
}

export function useEditorDispatch(): Dispatch<EditorAction> {
  const ctx = useContext(EditorDispatchContext);
  if (!ctx) throw new Error('useEditorDispatch must be used inside EditorProvider');
  return ctx;
}
