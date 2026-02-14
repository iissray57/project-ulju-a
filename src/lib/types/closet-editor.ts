// 에디터에서 사용하는 타입

export interface ClosetComponent {
  id: string;
  presetId?: string;
  name: string;
  position: [number, number, number]; // [x, y, z]
  rotation: [number, number, number]; // [rx, ry, rz]
  scale: [number, number, number]; // [sx, sy, sz]
  dimensions: { width: number; height: number; depth: number };
  color: string;
  material: string;
  locked: boolean;
}

export interface EditorState {
  components: ClosetComponent[];
  selectedId: string | null;
  cameraMode: '2d' | '3d';
  gridSize: number;
  snapEnabled: boolean;
  showDimensions: boolean;
  cameraResetCounter: number; // Increment to trigger camera reset
  isDragging: boolean; // True while a component is being dragged
}

export const DEFAULT_EDITOR_STATE: EditorState = {
  components: [],
  selectedId: null,
  cameraMode: '2d',
  gridSize: 50, // mm
  snapEnabled: true,
  showDimensions: true,
  cameraResetCounter: 0,
  isDragging: false,
};
