/** 2D 좌표 (mm 단위) */
export interface Point {
  x: number;
  y: number;
}

/** 벽 세그먼트 */
export interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number; // mm, default 200
}

/** 방 영역 (벽으로 구성된 폐합 다각형) */
export interface RoomBoundary {
  walls: Wall[];
  /** 편의: 외곽 꼭짓점 배열 */
  vertices: Point[];
}

/** 배치 가능한 객체 타입 */
export type FloorObjectType =
  | 'shelving_unit'   // 선반장
  | 'hanger_rack'     // 행거
  | 'drawer_unit'     // 서랍장
  | 'shoe_rack'       // 신발장
  | 'mirror'          // 전신거울
  | 'island'          // 아일랜드
  | 'door'            // 문
  | 'window';         // 창문

/** 배치된 객체 */
export interface FloorObject {
  id: string;
  type: FloorObjectType;
  name: string;
  x: number;          // mm - 좌상단 기준
  y: number;          // mm
  width: number;      // mm
  depth: number;      // mm
  height: number;     // mm (입면도/3D용)
  rotation: number;   // degrees (0, 90, 180, 270)
  color: string;      // hex
  wallId?: string;    // 벽에 부착된 경우
  locked: boolean;    // 이동 잠금
}

/** 에디터 도구 모드 */
export type EditorTool = 'select' | 'place' | 'measure' | 'wall_edit';

/** 에디터 상태 */
export interface FloorPlanState {
  // Room
  room: RoomBoundary | null;
  roomSetupOpen: boolean;  // 방 설정 다이얼로그 열림 여부

  // Objects
  objects: FloorObject[];
  selectedObjectId: string | null;

  // Tool
  activeTool: EditorTool;
  placingObjectType: FloorObjectType | null;

  // View
  zoom: number;       // 1 = 100%
  panOffset: Point;   // 캔버스 패닝 오프셋
  showGrid: boolean;
  showMeasurements: boolean;
  gridSize: number;   // mm, default 50
  snapToGrid: boolean;
  snapToWall: boolean;

  // History
  history: { room: RoomBoundary | null; objects: FloorObject[] }[];
  historyIndex: number;
}

/** mm → px 변환 상수 (1mm = 0.5px at zoom=1) */
export const MM_TO_PX = 0.5;

/** 그리드 스냅 */
export function snapToGridValue(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/** 점이 다각형 내부에 있는지 (ray-casting algorithm) */
export function isPointInPolygon(point: Point, vertices: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x, yi = vertices[i].y;
    const xj = vertices[j].x, yj = vertices[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** 사각형(AABB)이 다각형 내부에 완전히 포함되는지 */
export function isRectInPolygon(
  x: number,
  y: number,
  width: number,
  depth: number,
  rotation: number,
  vertices: Point[],
): boolean {
  // 회전된 4 꼭짓점 계산
  const cx = x + width / 2;
  const cy = y + depth / 2;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const hw = width / 2;
  const hd = depth / 2;

  const corners: Point[] = [
    { x: cx + -hw * cos - -hd * sin, y: cy + -hw * sin + -hd * cos },
    { x: cx + hw * cos - -hd * sin, y: cy + hw * sin + -hd * cos },
    { x: cx + hw * cos - hd * sin, y: cy + hw * sin + hd * cos },
    { x: cx + -hw * cos - hd * sin, y: cy + -hw * sin + hd * cos },
  ];

  return corners.every((corner) => isPointInPolygon(corner, vertices));
}
