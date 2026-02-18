'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type Dispatch,
  type ReactNode,
} from 'react';
import {
  DEFAULT_EDITOR_STATE,
  type ClosetComponent,
  type EditorState,
  type ViewMode,
  type UnitPart,
} from '@/lib/types/closet-editor';

// ── Actions ──────────────────────────────────────────────

type EditorAction =
  | { type: 'ADD_COMPONENT'; payload: ClosetComponent }
  | { type: 'REMOVE_COMPONENT'; payload: string }
  | { type: 'UPDATE_COMPONENT'; payload: { id: string; changes: Partial<ClosetComponent> } }
  | { type: 'SELECT_COMPONENT'; payload: string | null }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_GRID_SIZE'; payload: number }
  | { type: 'TOGGLE_SNAP' }
  | { type: 'TOGGLE_DIMENSIONS' }
  | { type: 'TOGGLE_GRID' }
  | { type: 'RESET_CAMERA' }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_DRAGGING'; payload: boolean }
  | { type: 'LOAD_STATE'; payload: EditorState }
  | { type: 'CLEAR_ALL' }
  | { type: 'ADD_PART'; payload: { componentId: string; part: UnitPart } }
  | { type: 'REMOVE_PART'; payload: { componentId: string; partId: string } }
  | { type: 'UPDATE_PART'; payload: { componentId: string; partId: string; changes: Partial<UnitPart> } }
  | { type: 'UNDO' }
  | { type: 'REDO' };

// Actions that should be tracked in history
const HISTORY_ACTIONS = [
  'ADD_COMPONENT', 'REMOVE_COMPONENT', 'UPDATE_COMPONENT',
  'ADD_PART', 'REMOVE_PART', 'UPDATE_PART', 'CLEAR_ALL',
];

// ── History State ──────────────────────────────────────────────

interface HistoryState {
  past: EditorState[];
  present: EditorState;
  future: EditorState[];
}

const MAX_HISTORY = 50;

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

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload, cameraResetCounter: state.cameraResetCounter + 1 };

    case 'SET_GRID_SIZE':
      return { ...state, gridSize: action.payload };

    case 'TOGGLE_SNAP':
      return { ...state, snapEnabled: !state.snapEnabled };

    case 'TOGGLE_DIMENSIONS':
      return { ...state, showDimensions: !state.showDimensions };

    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid };

    case 'RESET_CAMERA':
      return { ...state, cameraResetCounter: state.cameraResetCounter + 1 };

    case 'SET_ZOOM':
      return { ...state, zoom: action.payload };

    case 'SET_DRAGGING':
      return { ...state, isDragging: action.payload };

    case 'LOAD_STATE':
      return action.payload;

    case 'CLEAR_ALL':
      return { ...DEFAULT_EDITOR_STATE };

    case 'ADD_PART':
      return {
        ...state,
        components: state.components.map((c) =>
          c.id === action.payload.componentId
            ? { ...c, parts: [...(c.parts || []), action.payload.part] }
            : c
        ),
      };

    case 'REMOVE_PART':
      return {
        ...state,
        components: state.components.map((c) =>
          c.id === action.payload.componentId
            ? { ...c, parts: (c.parts || []).filter((p) => p.id !== action.payload.partId) }
            : c
        ),
      };

    case 'UPDATE_PART':
      return {
        ...state,
        components: state.components.map((c) =>
          c.id === action.payload.componentId
            ? {
                ...c,
                parts: (c.parts || []).map((p) =>
                  p.id === action.payload.partId ? { ...p, ...action.payload.changes } : p
                ),
              }
            : c
        ),
      };

    default:
      return state;
  }
}

// ── History Reducer ──────────────────────────────────────────────

function historyReducer(historyState: HistoryState, action: EditorAction): HistoryState {
  const { past, present, future } = historyState;

  switch (action.type) {
    case 'UNDO': {
      if (past.length === 0) return historyState;
      const previous = past[past.length - 1];
      const newPast = past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [present, ...future],
      };
    }

    case 'REDO': {
      if (future.length === 0) return historyState;
      const next = future[0];
      const newFuture = future.slice(1);
      return {
        past: [...past, present],
        present: next,
        future: newFuture,
      };
    }

    default: {
      const newPresent = editorReducer(present, action);
      if (newPresent === present) return historyState;

      // Only track certain actions in history
      if (HISTORY_ACTIONS.includes(action.type)) {
        return {
          past: [...past.slice(-MAX_HISTORY + 1), present],
          present: newPresent,
          future: [], // Clear redo stack on new action
        };
      }

      // Non-history actions just update present
      return {
        ...historyState,
        present: newPresent,
      };
    }
  }
}

// ── Context ──────────────────────────────────────────────

interface EditorContextValue {
  state: EditorState;
  canUndo: boolean;
  canRedo: boolean;
}

const EditorStateContext = createContext<EditorContextValue | null>(null);
const EditorDispatchContext = createContext<Dispatch<EditorAction> | null>(null);

const initialHistoryState: HistoryState = {
  past: [],
  present: DEFAULT_EDITOR_STATE,
  future: [],
};

export function EditorProvider({ children }: { children: ReactNode }) {
  const [historyState, dispatch] = useReducer(historyReducer, initialHistoryState);

  const contextValue: EditorContextValue = {
    state: historyState.present,
    canUndo: historyState.past.length > 0,
    canRedo: historyState.future.length > 0,
  };

  return (
    <EditorStateContext.Provider value={contextValue}>
      <EditorDispatchContext.Provider value={dispatch}>
        {children}
      </EditorDispatchContext.Provider>
    </EditorStateContext.Provider>
  );
}

export function useEditorState(): EditorState {
  const ctx = useContext(EditorStateContext);
  if (!ctx) throw new Error('useEditorState must be used inside EditorProvider');
  return ctx.state;
}

export function useEditorHistory(): { canUndo: boolean; canRedo: boolean } {
  const ctx = useContext(EditorStateContext);
  if (!ctx) throw new Error('useEditorHistory must be used inside EditorProvider');
  return { canUndo: ctx.canUndo, canRedo: ctx.canRedo };
}

export function useEditorDispatch(): Dispatch<EditorAction> {
  const ctx = useContext(EditorDispatchContext);
  if (!ctx) throw new Error('useEditorDispatch must be used inside EditorProvider');
  return ctx;
}
