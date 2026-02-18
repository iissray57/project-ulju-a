'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  FloorPlanState,
  FloorObject,
  FloorObjectType,
  RoomBoundary,
  EditorTool,
  Point,
} from './types';
import { OBJECT_CATALOG } from './data/object-catalog';

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
type Action =
  | { type: 'SET_ROOM'; room: RoomBoundary }
  | { type: 'SET_ROOM_SETUP_OPEN'; open: boolean }
  | { type: 'ADD_OBJECT'; obj: FloorObject }
  | { type: 'UPDATE_OBJECT'; id: string; patch: Partial<FloorObject> }
  | { type: 'REMOVE_OBJECT'; id: string }
  | { type: 'SELECT_OBJECT'; id: string | null }
  | { type: 'SET_TOOL'; tool: EditorTool }
  | { type: 'SET_PLACING_TYPE'; objType: FloorObjectType | null }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_PAN'; panOffset: Point }
  | { type: 'TOGGLE_GRID' }
  | { type: 'TOGGLE_MEASUREMENTS' }
  | { type: 'TOGGLE_SNAP_GRID' }
  | { type: 'SET_GRID_SIZE'; size: number }
  | { type: 'UNDO' }
  | { type: 'REDO' };

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------
const INITIAL_STATE: FloorPlanState = {
  room: null,
  roomSetupOpen: true,
  objects: [],
  selectedObjectId: null,
  activeTool: 'select',
  placingObjectType: null,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  showGrid: true,
  showMeasurements: true,
  gridSize: 50,
  snapToGrid: true,
  snapToWall: false,
  history: [],
  historyIndex: -1,
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
function pushHistory(
  state: FloorPlanState,
): FloorPlanState['history'] {
  const snapshot = { room: state.room, objects: [...state.objects] };
  const trimmed = state.history.slice(0, state.historyIndex + 1);
  return [...trimmed, snapshot].slice(-50); // max 50 steps
}

function reducer(state: FloorPlanState, action: Action): FloorPlanState {
  switch (action.type) {
    case 'SET_ROOM':
      return {
        ...state,
        room: action.room,
        history: pushHistory(state),
        historyIndex: state.historyIndex + 1,
      };

    case 'SET_ROOM_SETUP_OPEN':
      return { ...state, roomSetupOpen: action.open };

    case 'ADD_OBJECT': {
      const newObjects = [...state.objects, action.obj];
      return {
        ...state,
        objects: newObjects,
        selectedObjectId: action.obj.id,
        history: pushHistory(state),
        historyIndex: state.historyIndex + 1,
      };
    }

    case 'UPDATE_OBJECT': {
      const newObjects = state.objects.map((o) =>
        o.id === action.id ? { ...o, ...action.patch } : o,
      );
      return {
        ...state,
        objects: newObjects,
        history: pushHistory(state),
        historyIndex: state.historyIndex + 1,
      };
    }

    case 'REMOVE_OBJECT': {
      const newObjects = state.objects.filter((o) => o.id !== action.id);
      return {
        ...state,
        objects: newObjects,
        selectedObjectId:
          state.selectedObjectId === action.id ? null : state.selectedObjectId,
        history: pushHistory(state),
        historyIndex: state.historyIndex + 1,
      };
    }

    case 'SELECT_OBJECT':
      return { ...state, selectedObjectId: action.id };

    case 'SET_TOOL':
      return {
        ...state,
        activeTool: action.tool,
        placingObjectType: action.tool === 'place' ? state.placingObjectType : null,
      };

    case 'SET_PLACING_TYPE':
      return {
        ...state,
        placingObjectType: action.objType,
        activeTool: action.objType ? 'place' : 'select',
      };

    case 'SET_ZOOM':
      return { ...state, zoom: Math.min(3, Math.max(0.3, action.zoom)) };

    case 'SET_PAN':
      return { ...state, panOffset: action.panOffset };

    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid };

    case 'TOGGLE_MEASUREMENTS':
      return { ...state, showMeasurements: !state.showMeasurements };

    case 'TOGGLE_SNAP_GRID':
      return { ...state, snapToGrid: !state.snapToGrid };

    case 'SET_GRID_SIZE':
      return { ...state, gridSize: action.size };

    case 'UNDO': {
      if (state.historyIndex < 0) return state;
      const idx = state.historyIndex - 1;
      const snap = idx >= 0 ? state.history[idx] : { room: null, objects: [] };
      return {
        ...state,
        room: snap.room,
        objects: snap.objects,
        historyIndex: idx,
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const idx = state.historyIndex + 1;
      const snap = state.history[idx];
      return {
        ...state,
        room: snap.room,
        objects: snap.objects,
        historyIndex: idx,
      };
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface FloorPlanContextValue {
  state: FloorPlanState;
  canUndo: boolean;
  canRedo: boolean;
  setRoom: (room: RoomBoundary) => void;
  setRoomSetupOpen: (open: boolean) => void;
  addObject: (type: FloorObjectType, x: number, y: number) => void;
  updateObject: (id: string, patch: Partial<FloorObject>) => void;
  removeObject: (id: string) => void;
  selectObject: (id: string | null) => void;
  setTool: (tool: EditorTool) => void;
  setPlacingType: (objType: FloorObjectType | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (panOffset: Point) => void;
  toggleGrid: () => void;
  toggleMeasurements: () => void;
  toggleSnapGrid: () => void;
  setGridSize: (size: number) => void;
  undo: () => void;
  redo: () => void;
}

const FloorPlanContext = createContext<FloorPlanContextValue | null>(null);

interface FloorPlanProviderProps {
  children: ReactNode;
  orderId?: string | null;
  modelId?: string | null;
}

export function FloorPlanProvider({ children }: FloorPlanProviderProps) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const setRoom = useCallback(
    (room: RoomBoundary) => dispatch({ type: 'SET_ROOM', room }),
    [],
  );

  const setRoomSetupOpen = useCallback(
    (open: boolean) => dispatch({ type: 'SET_ROOM_SETUP_OPEN', open }),
    [],
  );

  const addObject = useCallback(
    (type: FloorObjectType, x: number, y: number) => {
      const catalog = OBJECT_CATALOG[type];
      const obj: FloorObject = {
        id: `${type}_${Date.now()}`,
        type,
        name: catalog.name,
        x,
        y,
        width: catalog.defaultWidth,
        depth: catalog.defaultDepth,
        height: catalog.defaultHeight,
        rotation: 0,
        color: catalog.color,
        locked: false,
      };
      dispatch({ type: 'ADD_OBJECT', obj });
    },
    [],
  );

  const updateObject = useCallback(
    (id: string, patch: Partial<FloorObject>) =>
      dispatch({ type: 'UPDATE_OBJECT', id, patch }),
    [],
  );

  const removeObject = useCallback(
    (id: string) => dispatch({ type: 'REMOVE_OBJECT', id }),
    [],
  );

  const selectObject = useCallback(
    (id: string | null) => dispatch({ type: 'SELECT_OBJECT', id }),
    [],
  );

  const setTool = useCallback(
    (tool: EditorTool) => dispatch({ type: 'SET_TOOL', tool }),
    [],
  );

  const setPlacingType = useCallback(
    (objType: FloorObjectType | null) =>
      dispatch({ type: 'SET_PLACING_TYPE', objType }),
    [],
  );

  const setZoom = useCallback(
    (zoom: number) => dispatch({ type: 'SET_ZOOM', zoom }),
    [],
  );

  const setPan = useCallback(
    (panOffset: Point) => dispatch({ type: 'SET_PAN', panOffset }),
    [],
  );

  const toggleGrid = useCallback(
    () => dispatch({ type: 'TOGGLE_GRID' }),
    [],
  );

  const toggleMeasurements = useCallback(
    () => dispatch({ type: 'TOGGLE_MEASUREMENTS' }),
    [],
  );

  const toggleSnapGrid = useCallback(
    () => dispatch({ type: 'TOGGLE_SNAP_GRID' }),
    [],
  );

  const setGridSize = useCallback(
    (size: number) => dispatch({ type: 'SET_GRID_SIZE', size }),
    [],
  );

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

  const value: FloorPlanContextValue = {
    state,
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
    setRoom,
    setRoomSetupOpen,
    addObject,
    updateObject,
    removeObject,
    selectObject,
    setTool,
    setPlacingType,
    setZoom,
    setPan,
    toggleGrid,
    toggleMeasurements,
    toggleSnapGrid,
    setGridSize,
    undo,
    redo,
  };

  return (
    <FloorPlanContext.Provider value={value}>
      {children}
    </FloorPlanContext.Provider>
  );
}

export function useFloorPlan(): FloorPlanContextValue {
  const ctx = useContext(FloorPlanContext);
  if (!ctx) {
    throw new Error('useFloorPlan must be used within FloorPlanProvider');
  }
  return ctx;
}
