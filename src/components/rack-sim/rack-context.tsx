'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import type { RackItem, VirtualBackground, CameraMode } from './types';
import { RACK_FRAME_COLORS } from './types';
import type { RackProductType } from './data/rack-products';
import { RACK_PRODUCTS } from './data/rack-products';
import { RACK_SIZE_CONFIGS } from './data/rack-sizes';
import type { RackOptionType } from './data/rack-options';
import { RACK_OPTIONS } from './data/rack-options';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface RackSimState {
  items: RackItem[];
  selectedItemId: string | null;
  cameraMode: CameraMode;
  background: VirtualBackground;
  orderId: string | null;
  modelId: string | null;
  history: RackItem[][];
  historyIndex: number;
}

const DEFAULT_STATE: RackSimState = {
  items: [],
  selectedItemId: null,
  cameraMode: 'free',
  background: 'empty',
  orderId: null,
  modelId: null,
  history: [[]],
  historyIndex: 0,
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type RackAction =
  | { type: 'ADD_ITEM'; payload: RackItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'SELECT_ITEM'; payload: string | null }
  | { type: 'UPDATE_ITEM'; payload: { id: string; updates: Partial<RackItem> } }
  | { type: 'UPDATE_ITEM_SIZE'; payload: { id: string; width?: number; depth?: number; height?: number } }
  | { type: 'UPDATE_POSITION'; payload: { id: string; x: number; z: number } }
  | { type: 'TOGGLE_OPTION'; payload: { id: string; option: RackOptionType } }
  | { type: 'SET_SHELF_COUNT'; payload: { id: string; count: number } }
  | { type: 'SET_BASE_TYPE'; payload: { id: string; baseType: RackItem['baseType'] } }
  | { type: 'ROTATE_ITEM'; payload: { id: string } }
  | { type: 'SET_CAMERA_MODE'; payload: CameraMode }
  | { type: 'SET_BACKGROUND'; payload: VirtualBackground }
  | { type: 'SET_ORDER_CONTEXT'; payload: { orderId: string | null; modelId: string | null } }
  | { type: 'SET_MODEL_ID'; payload: string }
  | { type: 'LOAD_STATE'; payload: RackItem[] }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the exclusive set for a given option type (from RACK_OPTIONS data). */
function getExclusives(option: RackOptionType): RackOptionType[] {
  return RACK_OPTIONS.find((o) => o.type === option)?.exclusive ?? [];
}

const BASE_OPTIONS: RackOptionType[] = ['leveling_foot', 'small_wheel', 'large_wheel'];

// ---------------------------------------------------------------------------
// History helpers
// ---------------------------------------------------------------------------

/** Push new items snapshot into history, truncating any redo future. */
function pushHistory(state: RackSimState, newItems: RackItem[]): Pick<RackSimState, 'items' | 'history' | 'historyIndex'> {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(newItems);
  return { items: newItems, history: newHistory, historyIndex: newHistory.length - 1 };
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function rackReducer(state: RackSimState, action: RackAction): RackSimState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const newItems = [...state.items, action.payload];
      return { ...state, ...pushHistory(state, newItems) };
    }

    case 'REMOVE_ITEM': {
      const filtered = state.items.filter((item) => item.id !== action.payload);
      return {
        ...state,
        ...pushHistory(state, filtered),
        selectedItemId:
          state.selectedItemId === action.payload ? null : state.selectedItemId,
      };
    }

    case 'SELECT_ITEM':
      return { ...state, selectedItemId: action.payload };

    case 'UPDATE_ITEM': {
      const newItems = state.items.map((item) =>
        item.id === action.payload.id
          ? { ...item, ...action.payload.updates }
          : item,
      );
      return { ...state, ...pushHistory(state, newItems) };
    }

    case 'UPDATE_ITEM_SIZE': {
      const newItems = state.items.map((item) => {
        if (item.id !== action.payload.id) return item;
        return {
          ...item,
          ...(action.payload.width !== undefined && { width: action.payload.width }),
          ...(action.payload.depth !== undefined && { depth: action.payload.depth }),
          ...(action.payload.height !== undefined && { height: action.payload.height }),
        };
      });
      return { ...state, ...pushHistory(state, newItems) };
    }

    case 'UPDATE_POSITION': {
      const newItems = state.items.map((item) =>
        item.id === action.payload.id
          ? { ...item, position: { x: action.payload.x, z: action.payload.z } }
          : item,
      );
      return { ...state, ...pushHistory(state, newItems) };
    }

    case 'TOGGLE_OPTION': {
      const newItems = state.items.map((item) => {
        if (item.id !== action.payload.id) return item;

        const { option } = action.payload;
        const isActive = item.options.includes(option);

        if (isActive) {
          return { ...item, options: item.options.filter((o) => o !== option) };
        }

        const exclusives = getExclusives(option);
        const pruned = item.options.filter((o) => !exclusives.includes(o));
        return { ...item, options: [...pruned, option] };
      });
      return { ...state, ...pushHistory(state, newItems) };
    }

    case 'SET_SHELF_COUNT': {
      const newItems = state.items.map((item) => {
        if (item.id !== action.payload.id) return item;
        const product = RACK_PRODUCTS[item.productType];
        const count = Math.max(
          product.minShelfCount,
          Math.min(product.maxShelfCount, action.payload.count),
        );
        return { ...item, shelfCount: count };
      });
      return { ...state, ...pushHistory(state, newItems) };
    }

    case 'SET_BASE_TYPE': {
      const { id, baseType } = action.payload;
      const newItems = state.items.map((item) => {
        if (item.id !== id) return item;
        const withoutBase = item.options.filter((o) => !BASE_OPTIONS.includes(o));
        return { ...item, baseType, options: [...withoutBase, baseType] };
      });
      return { ...state, ...pushHistory(state, newItems) };
    }

    case 'ROTATE_ITEM': {
      const newItems = state.items.map((item) => {
        if (item.id !== action.payload.id) return item;
        const nextRotation = ((item.rotation + 90) % 360) as 0 | 90 | 180 | 270;
        return { ...item, rotation: nextRotation };
      });
      return { ...state, ...pushHistory(state, newItems) };
    }

    case 'SET_CAMERA_MODE':
      return { ...state, cameraMode: action.payload };

    case 'SET_BACKGROUND':
      return { ...state, background: action.payload };

    case 'SET_ORDER_CONTEXT':
      return {
        ...state,
        orderId: action.payload.orderId,
        modelId: action.payload.modelId,
      };

    case 'SET_MODEL_ID':
      return { ...state, modelId: action.payload };

    case 'LOAD_STATE': {
      return { ...state, ...pushHistory(state, action.payload) };
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return { ...state, items: state.history[newIndex], historyIndex: newIndex };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return { ...state, items: state.history[newIndex], historyIndex: newIndex };
    }

    case 'RESET': {
      const emptyItems: RackItem[] = [];
      return { ...state, ...pushHistory(state, emptyItems), selectedItemId: null };
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface RackSimContextValue {
  state: RackSimState;
  dispatch: React.Dispatch<RackAction>;
  addRack: (productType: RackProductType) => void;
  selectedItem: RackItem | undefined;
}

const RackSimContext = createContext<RackSimContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface RackSimProviderProps {
  children: ReactNode;
  orderId?: string | null;
  modelId?: string | null;
}

export function RackSimProvider({ children, orderId = null, modelId = null }: RackSimProviderProps) {
  const [state, dispatch] = useReducer(rackReducer, DEFAULT_STATE);

  // Sync external orderId/modelId into state when props change
  useEffect(() => {
    dispatch({ type: 'SET_ORDER_CONTEXT', payload: { orderId, modelId } });
  }, [orderId, modelId]);

  const addRack = useCallback(
    (productType: RackProductType) => {
      const MM = 0.001;
      const RACK_GAP = 200 * MM; // 200mm gap
      const sizeConfig = RACK_SIZE_CONFIGS[productType];
      const product = RACK_PRODUCTS[productType];

      // Compute initial X position: place to the right of all existing racks, centered
      const existingItems = state.items;
      const totalWidth =
        existingItems.reduce((sum, item) => sum + item.width * MM, 0) +
        RACK_GAP * existingItems.length;
      const newItemWidth = sizeConfig.defaultWidth * MM;
      // Center of scene: subtract half total span including new item
      const totalSpan = totalWidth + newItemWidth;
      // Existing items were arranged from -totalSpan/2 to +totalSpan/2 (approx)
      // New item goes at the right end of existing items
      const newX = totalWidth - totalSpan / 2 + newItemWidth / 2;

      const newItem: RackItem = {
        id: `rack-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        productType,
        name: `${product.name} ${state.items.length + 1}`,
        width: sizeConfig.defaultWidth,
        depth: sizeConfig.defaultDepth,
        height: sizeConfig.defaultHeight,
        shelfCount: product.defaultShelfCount,
        options: ['leveling_foot'],
        baseType: 'leveling_foot',
        color: RACK_FRAME_COLORS.silver.hex,
        rotation: 0,
        position: { x: newX, z: 0 },
      };
      dispatch({ type: 'ADD_ITEM', payload: newItem });
    },
    [state.items],
  );

  const selectedItem = useMemo(
    () => state.items.find((item) => item.id === state.selectedItemId),
    [state.items, state.selectedItemId],
  );

  const value = useMemo<RackSimContextValue>(
    () => ({ state, dispatch, addRack, selectedItem }),
    [state, addRack, selectedItem],
  );

  return <RackSimContext.Provider value={value}>{children}</RackSimContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRackSim(): RackSimContextValue {
  const context = useContext(RackSimContext);
  if (!context) throw new Error('useRackSim must be used within RackSimProvider');
  return context;
}
