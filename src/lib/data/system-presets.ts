/**
 * 시스템 프리셋 데이터 - A~F 타입 + 드레스룸 특화 가구
 *
 * 이미지 참조: assets/closet_type.png
 * - A타입: 상단 봉 + 하단 선반
 * - B타입: 상단 봉 + 중간 선반 + 하단 선반
 * - C타입: 상단 봉 + 중간 짧은 봉 + 하단 선반
 * - D타입: 상단 봉 + 중간 선반 2개 + 하단 선반
 * - E타입: 상단 봉 + 중간 선반 + 하단 봉 + 하단 선반
 * - F타입: 상단 봉 + 중간 선반 3개 + 하단 선반
 *
 * 드레스룸 특화 가구:
 * - 서랍장 (drawer_unit): 서랍 4~6단
 * - 신발장 (shoe_rack): 경사 선반
 * - 아일랜드 (island): 중앙 독립 서랍장
 * - 전신거울 (mirror): 벽면 거울
 * - 악세서리함 (accessory_box): 작은 수납칸
 */

import type { ClosetPresetType, UnitPart, DressingFurnitureType } from '@/lib/types/closet-editor';

// 프레임 색상
export const FRAME_COLORS = {
  silver: { name: '실버', hex: '#C0C0C0' },
  white: { name: '화이트', hex: '#F5F5F5' },
} as const;

// 부품 색상
export const PART_COLORS = {
  rod: '#4A90D9',    // 봉 - 파란색
  shelf: '#4A90D9',  // 선반 - 파란색
} as const;

// 기본 높이 (mm)
const UNIT_HEIGHT = 2400;
const SHELF_HEIGHT = 25;
const ROD_HEIGHT = 30;

// ── 타입별 내부 부품 정의 ──────────────────────────────────────

function createParts(type: ClosetPresetType): UnitPart[] {
  const parts: UnitPart[] = [];
  let partIndex = 0;
  const makeId = () => `part-${partIndex++}`;

  switch (type) {
    case 'A':
      // 상단 봉 + 하단 선반
      parts.push({ id: makeId(), type: 'rod', y: 1800, height: ROD_HEIGHT });
      parts.push({ id: makeId(), type: 'shelf', y: 100, height: SHELF_HEIGHT });
      break;

    case 'B':
      // 상단 봉 + 중간 선반 + 하단 선반
      parts.push({ id: makeId(), type: 'rod', y: 1800, height: ROD_HEIGHT });
      parts.push({ id: makeId(), type: 'shelf', y: 1200, height: SHELF_HEIGHT });
      parts.push({ id: makeId(), type: 'shelf', y: 100, height: SHELF_HEIGHT });
      break;

    case 'C':
      // 상단 봉 + 중간 짧은 봉 + 하단 선반
      parts.push({ id: makeId(), type: 'rod', y: 1800, height: ROD_HEIGHT });
      parts.push({ id: makeId(), type: 'rod', y: 1000, height: ROD_HEIGHT });
      parts.push({ id: makeId(), type: 'shelf', y: 100, height: SHELF_HEIGHT });
      break;

    case 'D':
      // 상단 봉 + 중간 선반 2개 + 하단 선반
      parts.push({ id: makeId(), type: 'rod', y: 1800, height: ROD_HEIGHT });
      parts.push({ id: makeId(), type: 'shelf', y: 1400, height: SHELF_HEIGHT });
      parts.push({ id: makeId(), type: 'shelf', y: 1000, height: SHELF_HEIGHT });
      parts.push({ id: makeId(), type: 'shelf', y: 100, height: SHELF_HEIGHT });
      break;

    case 'E':
      // 상단 봉 + 중간 선반 + 하단 봉 + 하단 선반
      parts.push({ id: makeId(), type: 'rod', y: 1800, height: ROD_HEIGHT });
      parts.push({ id: makeId(), type: 'shelf', y: 1200, height: SHELF_HEIGHT });
      parts.push({ id: makeId(), type: 'rod', y: 600, height: ROD_HEIGHT });
      parts.push({ id: makeId(), type: 'shelf', y: 100, height: SHELF_HEIGHT });
      break;

    case 'F':
      // 상단 봉 + 중간 선반 3개 + 하단 선반
      parts.push({ id: makeId(), type: 'rod', y: 1800, height: ROD_HEIGHT });
      parts.push({ id: makeId(), type: 'shelf', y: 1500, height: SHELF_HEIGHT });
      parts.push({ id: makeId(), type: 'shelf', y: 1200, height: SHELF_HEIGHT });
      parts.push({ id: makeId(), type: 'shelf', y: 900, height: SHELF_HEIGHT });
      parts.push({ id: makeId(), type: 'shelf', y: 100, height: SHELF_HEIGHT });
      break;
  }

  return parts;
}

// ── 시스템 프리셋 인터페이스 ──────────────────────────────────

export interface SystemPreset {
  name: string;
  category: string;
  presetType: ClosetPresetType;
  preset_data: {
    width: number;
    height: number;
    depth: number;
    color: string;
    material: string;
    geometry: string;
    parts: UnitPart[];
  };
  is_system: true;
}

// ── 너비 옵션 ──────────────────────────────────────────────────

const WIDTHS = [600, 800, 900, 1000, 1200];
const DEPTH = 600;

// ── 시스템 프리셋 생성 ──────────────────────────────────────────

function createPresets(): SystemPreset[] {
  const presets: SystemPreset[] = [];
  const types: ClosetPresetType[] = ['A', 'B', 'C', 'D', 'E', 'F'];

  for (const type of types) {
    for (const width of WIDTHS) {
      presets.push({
        name: `${type}타입 ${width}`,
        category: 'closet_unit',
        presetType: type,
        preset_data: {
          width,
          height: UNIT_HEIGHT,
          depth: DEPTH,
          color: FRAME_COLORS.white.hex,
          material: 'metal',
          geometry: 'box',
          parts: createParts(type),
        },
        is_system: true,
      });
    }
  }

  return presets;
}

export const SYSTEM_PRESETS: SystemPreset[] = createPresets();

// ── 프리셋 카테고리 (UI 표시용) ────────────────────────────────

export const PRESET_TYPE_INFO: Record<ClosetPresetType, { label: string; description: string }> = {
  A: { label: 'A타입', description: '상단 봉 + 하단 선반 (긴 옷)' },
  B: { label: 'B타입', description: '상단 봉 + 중간/하단 선반' },
  C: { label: 'C타입', description: '상단 봉 + 중간 봉 + 하단 선반' },
  D: { label: 'D타입', description: '상단 봉 + 선반 3개' },
  E: { label: 'E타입', description: '상/하단 봉 + 선반 2개' },
  F: { label: 'F타입', description: '상단 봉 + 선반 4개' },
};

// ══════════════════════════════════════════════════════════════════
// 드레스룸 특화 가구 프리셋
// ══════════════════════════════════════════════════════════════════

export interface DressingFurniturePreset {
  id: string;
  name: string;
  furnitureType: DressingFurnitureType;
  icon: string;  // 이모지 아이콘
  description: string;
  preset_data: {
    width: number;
    height: number;
    depth: number;
    color: string;
    parts: UnitPart[];
  };
}

// ── 서랍장 부품 생성 ──────────────────────────────────────────────
function createDrawerParts(drawerCount: number, unitHeight: number): UnitPart[] {
  const parts: UnitPart[] = [];
  const drawerHeight = Math.floor((unitHeight - 100) / drawerCount); // 하단 여백 100mm

  for (let i = 0; i < drawerCount; i++) {
    parts.push({
      id: `drawer-${i}`,
      type: 'drawer',
      y: 50 + i * drawerHeight,
      height: drawerHeight - 20, // 서랍 간 간격 20mm
    });
  }
  return parts;
}

// ── 신발장 부품 생성 (경사 선반) ────────────────────────────────────
function createShoeShelfParts(shelfCount: number, unitHeight: number): UnitPart[] {
  const parts: UnitPart[] = [];
  const shelfSpacing = Math.floor((unitHeight - 100) / shelfCount);

  for (let i = 0; i < shelfCount; i++) {
    parts.push({
      id: `shoe-shelf-${i}`,
      type: 'shoe-shelf',
      y: 50 + i * shelfSpacing,
      height: 25,
    });
  }
  return parts;
}

// ── 악세서리함 부품 생성 ───────────────────────────────────────────
function createAccessoryParts(): UnitPart[] {
  return [
    { id: 'divider-1', type: 'divider', y: 100, height: 100 },
    { id: 'divider-2', type: 'divider', y: 250, height: 100 },
    { id: 'divider-3', type: 'divider', y: 400, height: 100 },
    { id: 'shelf-1', type: 'shelf', y: 550, height: 25 },
    { id: 'shelf-2', type: 'shelf', y: 750, height: 25 },
  ];
}

// ── 드레스룸 가구 프리셋 목록 ────────────────────────────────────
export const DRESSING_FURNITURE_PRESETS: DressingFurniturePreset[] = [
  // 서랍장
  {
    id: 'drawer-4-600',
    name: '서랍장 4단',
    furnitureType: 'drawer_unit',
    icon: '🗄️',
    description: '서랍 4단 (속옷, 양말 등)',
    preset_data: {
      width: 600,
      height: 1200,
      depth: 500,
      color: '#faf9f7',
      parts: createDrawerParts(4, 1200),
    },
  },
  {
    id: 'drawer-6-600',
    name: '서랍장 6단',
    furnitureType: 'drawer_unit',
    icon: '🗄️',
    description: '서랍 6단 (다용도)',
    preset_data: {
      width: 600,
      height: 1800,
      depth: 500,
      color: '#faf9f7',
      parts: createDrawerParts(6, 1800),
    },
  },
  {
    id: 'drawer-4-900',
    name: '서랍장 4단 (와이드)',
    furnitureType: 'drawer_unit',
    icon: '🗄️',
    description: '넓은 서랍 4단',
    preset_data: {
      width: 900,
      height: 1200,
      depth: 500,
      color: '#faf9f7',
      parts: createDrawerParts(4, 1200),
    },
  },

  // 신발장
  {
    id: 'shoe-rack-8',
    name: '신발장 8단',
    furnitureType: 'shoe_rack',
    icon: '👟',
    description: '경사 선반 8단 (약 16켤레)',
    preset_data: {
      width: 800,
      height: 1600,
      depth: 350,
      color: '#faf9f7',
      parts: createShoeShelfParts(8, 1600),
    },
  },
  {
    id: 'shoe-rack-10',
    name: '신발장 10단',
    furnitureType: 'shoe_rack',
    icon: '👟',
    description: '경사 선반 10단 (약 20켤레)',
    preset_data: {
      width: 800,
      height: 2000,
      depth: 350,
      color: '#faf9f7',
      parts: createShoeShelfParts(10, 2000),
    },
  },

  // 아일랜드 (중앙 독립 가구)
  {
    id: 'island-4drawer',
    name: '아일랜드 서랍장',
    furnitureType: 'island',
    icon: '🏝️',
    description: '중앙 배치용 서랍장 (양면 사용)',
    preset_data: {
      width: 1200,
      height: 900,
      depth: 600,
      color: '#f5f0e8',
      parts: createDrawerParts(3, 900),
    },
  },
  {
    id: 'island-display',
    name: '아일랜드 디스플레이',
    furnitureType: 'island',
    icon: '🏝️',
    description: '중앙 배치용 진열대',
    preset_data: {
      width: 1000,
      height: 1000,
      depth: 500,
      color: '#f5f0e8',
      parts: [
        { id: 'shelf-1', type: 'shelf', y: 300, height: 25 },
        { id: 'shelf-2', type: 'shelf', y: 600, height: 25 },
      ],
    },
  },

  // 전신거울
  {
    id: 'mirror-full',
    name: '전신거울',
    furnitureType: 'mirror',
    icon: '🪞',
    description: '벽면 부착형 전신거울',
    preset_data: {
      width: 600,
      height: 1800,
      depth: 50,
      color: '#e8f4fc',
      parts: [],
    },
  },
  {
    id: 'mirror-wide',
    name: '전신거울 (와이드)',
    furnitureType: 'mirror',
    icon: '🪞',
    description: '넓은 전신거울',
    preset_data: {
      width: 900,
      height: 2000,
      depth: 50,
      color: '#e8f4fc',
      parts: [],
    },
  },

  // 악세서리함
  {
    id: 'accessory-small',
    name: '악세서리함',
    furnitureType: 'accessory_box',
    icon: '💍',
    description: '시계, 반지, 목걸이 등',
    preset_data: {
      width: 500,
      height: 900,
      depth: 400,
      color: '#faf5f0',
      parts: createAccessoryParts(),
    },
  },
  {
    id: 'accessory-large',
    name: '악세서리함 (대형)',
    furnitureType: 'accessory_box',
    icon: '💍',
    description: '가방, 벨트, 악세서리',
    preset_data: {
      width: 600,
      height: 1200,
      depth: 450,
      color: '#faf5f0',
      parts: [
        ...createAccessoryParts(),
        { id: 'shelf-3', type: 'shelf', y: 950, height: 25 },
      ],
    },
  },
];

// ── 가구 타입별 정보 ───────────────────────────────────────────────
export const FURNITURE_TYPE_INFO: Record<DressingFurnitureType, { label: string; icon: string; description: string }> = {
  closet_unit: { label: '옷장 유닛', icon: '👔', description: '행거/선반 조합' },
  drawer_unit: { label: '서랍장', icon: '🗄️', description: '서랍 수납' },
  shoe_rack: { label: '신발장', icon: '👟', description: '경사 선반' },
  island: { label: '아일랜드', icon: '🏝️', description: '중앙 독립가구' },
  mirror: { label: '전신거울', icon: '🪞', description: '벽면 거울' },
  accessory_box: { label: '악세서리함', icon: '💍', description: '소품 수납' },
};
