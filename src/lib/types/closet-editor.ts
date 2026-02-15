// 2D 디자이너에서 사용하는 타입

export type ShapeType = 'rect' | 'rounded-rect' | 'circle' | 'text';

export interface ClosetComponent {
  id: string;
  presetId?: string;
  name: string;
  shapeType: ShapeType;
  position: [number, number, number]; // [x, 0, z] (y는 항상 0)
  rotation: [number, number, number]; // [0, ry, 0] (y축 회전만 사용)
  scale: [number, number, number];
  dimensions: { width: number; height: number; depth: number };
  color: string;
  borderColor?: string;
  borderRadius?: number; // rounded-rect용 (mm)
  opacity?: number;
  label?: string; // 텍스트 레이블
  locked: boolean;
}

export interface EditorState {
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

export const DEFAULT_EDITOR_STATE: EditorState = {
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
