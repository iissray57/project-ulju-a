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

// ── 드레스룸 가구 카테고리 ──────────────────────────────────────
export type DressingFurnitureType =
  | 'closet_unit'    // 옷장 유닛 (A~F 타입)
  | 'drawer_unit'    // 서랍장
  | 'shoe_rack'      // 신발장
  | 'island'         // 아일랜드 (중앙 독립가구)
  | 'mirror'         // 전신거울
  | 'accessory_box'; // 악세서리함

export interface UnitPart {
  id: string;
  type: PartType;
  y: number;        // 하단 기준 Y 위치 (mm)
  height: number;   // 부품 높이 (mm) - shelf: 25, rod: 30
}

// ── 프리셋 타입 (A~F) ──────────────────────────────────────────
export type ClosetPresetType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

// ── 코너 타입 (ㄱ자/ㄴ자) ─────────────────────────────────────────
export type CornerType = 'L' | 'R';  // L: ㄱ자 (왼쪽 위로), R: ㄴ자 (오른쪽 위로)

export interface ClosetComponent {
  id: string;
  presetId?: string;
  presetType?: ClosetPresetType;  // A~F 타입
  furnitureType?: DressingFurnitureType; // 드레스룸 가구 카테고리
  cornerType?: CornerType;        // 코너 타입 (ㄱ자/ㄴ자)
  name: string;
  shapeType: ShapeType;
  position: [number, number, number]; // [x, 0, z] (y는 항상 0)
  rotation: [number, number, number]; // [0, ry, 0] (y축 회전만 사용)
  scale: [number, number, number];
  dimensions: { width: number; height: number; depth: number };
  color: string;
  material?: MaterialType; // 재질 타입
  borderColor?: string;
  borderRadius?: number; // rounded-rect용 (mm)
  opacity?: number;
  label?: string; // 텍스트 레이블
  locked: boolean;
  mirrored?: boolean;  // 좌우 반전 (평면도 전용)
  parts?: UnitPart[];  // 내부 부품 (선반, 봉 등) - 입면도용
  doorType?: DoorType; // 도어 타입 (없음/패널/슬라이딩/유리)
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
  gridSize: 50, // mm
  snapEnabled: true,
  showDimensions: true,
  showGrid: true,
  cameraResetCounter: 0,
  isDragging: false,
  zoom: 80,
};
