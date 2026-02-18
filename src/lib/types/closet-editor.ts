// 2D 디자이너에서 사용하는 타입

export type ShapeType = 'rect' | 'rounded-rect' | 'circle' | 'text';

// 뷰 모드
export type ViewMode = 'plan' | 'elevation' | '3d';

// 재질 타입
export type MaterialType = 'melamine' | 'mdf' | 'wood' | 'glass';

// ── 도어 타입 ──────────────────────────────────────────────────
export type DoorType = 'none' | 'panel' | 'sliding' | 'glass';

// ── 내부 부품 타입 (입면도용) ──────────────────────────────────
export type PartType = 'shelf' | 'rod' | 'drawer' | 'shoe-shelf' | 'pants-hanger' | 'divider';

// ── 가구 카테고리 (4종) ──────────────────────────────────────
export type FurnitureCategory = 'wardrobe' | 'drawer_cabinet' | 'bedding_cabinet' | 'mirror_cabinet';

// ── 프레임 색상 ──────────────────────────────────────────────
export type FrameColorKey = 'silver' | 'black' | 'white' | 'champagne_gold';

export const FRAME_COLOR_OPTIONS: Record<FrameColorKey, { label: string; hex: string }> = {
  silver: { label: '실버', hex: '#C0C0C0' },
  black: { label: '블랙', hex: '#2C2C2C' },
  white: { label: '화이트', hex: '#F5F5F5' },
  champagne_gold: { label: '샴페인골드', hex: '#D4AF37' },
};

// ── 선반 색상 (옷장 전용) ──────────────────────────────────────
export type ShelfColorKey =
  | 'white'
  | 'white_oak'
  | 'maple'
  | 'walnut'
  | 'gray'
  | 'stone_white'
  | 'stone_gray';

export const SHELF_COLOR_OPTIONS: Record<ShelfColorKey, { label: string; hex: string }> = {
  white: { label: '화이트', hex: '#F5F5F5' },
  white_oak: { label: '화이트오크', hex: '#E8DCC4' },
  maple: { label: '메이플', hex: '#F2D8A0' },
  walnut: { label: '월넛', hex: '#6B4226' },
  gray: { label: '그레이', hex: '#9CA3AF' },
  stone_white: { label: '스톤화이트', hex: '#E8E4DF' },
  stone_gray: { label: '스톤그레이', hex: '#B0ADA8' },
};

// ── 드레스룸 가구 카테고리 ──────────────────────────────────────
export type DressingFurnitureType =
  | 'closet_unit'    // 옷장 유닛 (A~F 타입)
  | 'drawer_unit'    // 서랍장
  | 'bedding_unit'   // 이불장
  | 'mirror'         // 거울장
  | 'shoe_rack'      // 신발장 (레거시)
  | 'island'         // 아일랜드 (레거시)
  | 'accessory_box'; // 악세서리함 (레거시)

export interface UnitPart {
  id: string;
  type: PartType;
  y: number;        // 하단 기준 Y 위치 (mm)
  height: number;   // 부품 높이 (mm) - shelf: 25, rod: 30
}

// ── 프리셋 타입 (A~F) ──────────────────────────────────────────
export type ClosetPresetType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

// ── 코너 타입 (ㄱ자/ㄴ자) ─────────────────────────────────────────
export type CornerType = 'L' | 'R';

export interface ClosetComponent {
  id: string;
  presetId?: string;
  presetType?: ClosetPresetType;
  furnitureType?: DressingFurnitureType;
  furnitureCategory?: FurnitureCategory;
  cornerType?: CornerType;
  name: string;
  shapeType: ShapeType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  dimensions: { width: number; height: number; depth: number };
  color: string;
  frameColor?: FrameColorKey;
  shelfColor?: ShelfColorKey;
  material?: MaterialType;
  borderColor?: string;
  borderRadius?: number;
  opacity?: number;
  label?: string;
  locked: boolean;
  mirrored?: boolean;
  parts?: UnitPart[];
  doorType?: DoorType;
}

export interface EditorState {
  viewMode: ViewMode;
  components: ClosetComponent[];
  selectedId: string | null;
  gridSize: number;
  snapEnabled: boolean;
  showDimensions: boolean;
  showGrid: boolean;
  cameraResetCounter: number;
  isDragging: boolean;
  zoom: number;
}

export function createFrame(width: number, depth: number): ClosetComponent {
  return {
    id: 'default-frame',
    name: '방 영역',
    shapeType: 'rect',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    dimensions: { width, height: 100, depth },
    color: '#f8fafc',
    borderColor: '#64748b',
    locked: true,
  };
}

export const DEFAULT_EDITOR_STATE: EditorState = {
  viewMode: 'plan',
  components: [],
  selectedId: null,
  gridSize: 50,
  snapEnabled: true,
  showDimensions: true,
  showGrid: true,
  cameraResetCounter: 0,
  isDragging: false,
  zoom: 80,
};

// ── 가구 카테고리 메타 ──────────────────────────────────────────
export const FURNITURE_CATEGORY_META: Record<FurnitureCategory, {
  label: string;
  dressingType: DressingFurnitureType;
  hasTypes: boolean;
  hasShelfColor: boolean;
  fixedWidth?: number;
  fixedDepth?: number;
}> = {
  wardrobe: {
    label: '옷장',
    dressingType: 'closet_unit',
    hasTypes: true,
    hasShelfColor: true,
  },
  drawer_cabinet: {
    label: '서랍장',
    dressingType: 'drawer_unit',
    hasTypes: true,
    hasShelfColor: false,
  },
  bedding_cabinet: {
    label: '이불장',
    dressingType: 'bedding_unit',
    hasTypes: true,
    hasShelfColor: false,
  },
  mirror_cabinet: {
    label: '거울장',
    dressingType: 'mirror',
    hasTypes: false,
    hasShelfColor: false,
    fixedWidth: 400,
    fixedDepth: 400,
  },
};
