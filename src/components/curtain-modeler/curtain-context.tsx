'use client';

import { createContext, useContext, useReducer, type ReactNode } from 'react';

// 커튼 유형
export type CurtainStyle = 'drape' | 'sheer' | 'blackout' | 'roman' | 'cafe';
export type BlindStyle = 'roller' | 'venetian' | 'vertical' | 'honeycomb' | 'combi';
export type ProductType = 'curtain' | 'blind';

export interface WindowConfig {
  width: number;   // 창 폭 (mm)
  height: number;  // 창 높이 (mm)
  sillHeight: number; // 창대 높이 (바닥~창 하단, mm)
}

export interface CurtainConfig {
  productType: ProductType;
  // 커튼
  curtainStyle: CurtainStyle;
  curtainColor: string;    // 겉커튼 색상 (hex)
  foldMultiplier: number;  // 주름 배율 (1.5~3.0)
  curtainLength: 'sill' | 'below-sill' | 'floor'; // 창대/창대 아래/바닥
  splitCenter: boolean;    // 양개 여부
  openRatio: number;       // 개폐 비율 (0=닫힘, 1=완전 열림)
  blackoutPercent: number; // 암막률 (0~100), blackout 스타일에서만 사용
  // 2중 커튼
  doubleCurtain: boolean;  // 2중 커튼 (속커튼+겉커튼)
  innerCurtainStyle: CurtainStyle; // 속커튼 스타일
  innerCurtainColor: string;       // 속커튼 색상 (hex)
  // 블라인드
  blindStyle: BlindStyle;
  slatAngle: number;       // 슬랫 각도 (0~90)
  blindSections: number;   // 블라인드 분할 수 (1~3)
  // 레일
  railExtension: number;   // 레일 좌우 연장 (mm)
  // 겉커튼 제품
  selectedProductId: string | null;
  selectedProductName: string | null;
  selectedProductPrice: number | null; // 단가 (원/m)
  // 속커튼 제품
  innerProductId: string | null;
  innerProductName: string | null;
  innerProductPrice: number | null;
}

export interface CurtainModelerState {
  window: WindowConfig;
  config: CurtainConfig;
}

const initialState: CurtainModelerState = {
  window: {
    width: 1800,
    height: 1200,
    sillHeight: 900,
  },
  config: {
    productType: 'curtain',
    curtainStyle: 'drape',
    curtainColor: '#8B7355',
    foldMultiplier: 2.0,
    curtainLength: 'floor',
    splitCenter: true,
    openRatio: 0,
    blackoutPercent: 99,
    doubleCurtain: false,
    innerCurtainStyle: 'sheer',
    innerCurtainColor: '#F5F0E8',
    blindStyle: 'roller',
    slatAngle: 45,
    blindSections: 1,
    railExtension: 150,
    selectedProductId: null,
    selectedProductName: null,
    selectedProductPrice: null,
    innerProductId: null,
    innerProductName: null,
    innerProductPrice: null,
  },
};

type Action =
  | { type: 'SET_WINDOW'; payload: Partial<WindowConfig> }
  | { type: 'SET_CONFIG'; payload: Partial<CurtainConfig> }
  | { type: 'RESET' };

function reducer(state: CurtainModelerState, action: Action): CurtainModelerState {
  switch (action.type) {
    case 'SET_WINDOW':
      return { ...state, window: { ...state.window, ...action.payload } };
    case 'SET_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface CurtainContextType {
  state: CurtainModelerState;
  setWindow: (patch: Partial<WindowConfig>) => void;
  setConfig: (patch: Partial<CurtainConfig>) => void;
  reset: () => void;
}

const CurtainContext = createContext<CurtainContextType | null>(null);

export function CurtainProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setWindow = (patch: Partial<WindowConfig>) =>
    dispatch({ type: 'SET_WINDOW', payload: patch });
  const setConfig = (patch: Partial<CurtainConfig>) =>
    dispatch({ type: 'SET_CONFIG', payload: patch });
  const reset = () => dispatch({ type: 'RESET' });

  return (
    <CurtainContext.Provider value={{ state, setWindow, setConfig, reset }}>
      {children}
    </CurtainContext.Provider>
  );
}

export function useCurtainModeler() {
  const ctx = useContext(CurtainContext);
  if (!ctx) throw new Error('useCurtainModeler must be used within CurtainProvider');
  return ctx;
}
