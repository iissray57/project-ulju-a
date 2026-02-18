/**
 * 시스템 프리셋 데이터 - 드레스룸 오픈형 가구
 *
 * 가구 종류: 옷장, 서랍장, 이불장, 거울장
 * 공통: 깊이 400mm, 높이 2400mm, 너비 400~900mm (100단위)
 * 거울장: 400x400 고정
 */

import type { ClosetPresetType, UnitPart, FurnitureCategory, DressingFurnitureType } from '@/lib/types/closet-editor';

// ── 기본 치수 (mm) ──────────────────────────────────────────────
export const UNIT_HEIGHT = 2400;
export const UNIT_DEPTH = 400;
export const PILLAR_WIDTH = 30;

const SHELF_HEIGHT = 25;
const ROD_HEIGHT = 30;
const DRAWER_HEIGHT = 200;

// ── 너비 옵션 ──────────────────────────────────────────────────
export const WIDTH_OPTIONS = [400, 500, 600, 700, 800, 900];
export const DEFAULT_WIDTH = 600;

// ── 옷장 타입별 내부 부품 ──────────────────────────────────────
export function createWardrobeParts(type: ClosetPresetType): UnitPart[] {
  const parts: UnitPart[] = [];
  let idx = 0;
  const id = () => `part-${idx++}`;

  switch (type) {
    case 'A':
      parts.push({ id: id(), type: 'rod', y: 1800, height: ROD_HEIGHT });
      parts.push({ id: id(), type: 'shelf', y: 100, height: SHELF_HEIGHT });
      break;
    case 'B':
      parts.push({ id: id(), type: 'rod', y: 1800, height: ROD_HEIGHT });
      parts.push({ id: id(), type: 'shelf', y: 1200, height: SHELF_HEIGHT });
      parts.push({ id: id(), type: 'shelf', y: 100, height: SHELF_HEIGHT });
      break;
    case 'C':
      parts.push({ id: id(), type: 'rod', y: 1800, height: ROD_HEIGHT });
      parts.push({ id: id(), type: 'rod', y: 1000, height: ROD_HEIGHT });
      parts.push({ id: id(), type: 'shelf', y: 100, height: SHELF_HEIGHT });
      break;
    case 'D':
      parts.push({ id: id(), type: 'rod', y: 1800, height: ROD_HEIGHT });
      parts.push({ id: id(), type: 'shelf', y: 1400, height: SHELF_HEIGHT });
      parts.push({ id: id(), type: 'shelf', y: 1000, height: SHELF_HEIGHT });
      parts.push({ id: id(), type: 'shelf', y: 100, height: SHELF_HEIGHT });
      break;
    case 'E':
      parts.push({ id: id(), type: 'rod', y: 1800, height: ROD_HEIGHT });
      parts.push({ id: id(), type: 'shelf', y: 1200, height: SHELF_HEIGHT });
      parts.push({ id: id(), type: 'rod', y: 600, height: ROD_HEIGHT });
      parts.push({ id: id(), type: 'shelf', y: 100, height: SHELF_HEIGHT });
      break;
    case 'F':
      parts.push({ id: id(), type: 'rod', y: 1800, height: ROD_HEIGHT });
      parts.push({ id: id(), type: 'shelf', y: 1500, height: SHELF_HEIGHT });
      parts.push({ id: id(), type: 'shelf', y: 1200, height: SHELF_HEIGHT });
      parts.push({ id: id(), type: 'shelf', y: 900, height: SHELF_HEIGHT });
      parts.push({ id: id(), type: 'shelf', y: 100, height: SHELF_HEIGHT });
      break;
  }
  return parts;
}

// ── 서랍장 타입별 내부 부품 ──────────────────────────────────────
export function createDrawerCabinetParts(type: ClosetPresetType): UnitPart[] {
  const parts: UnitPart[] = [];
  let idx = 0;
  const id = () => `part-${idx++}`;

  const configs: Record<ClosetPresetType, { drawers: number[]; shelves: number[] }> = {
    A: { drawers: [100, 400, 700], shelves: [1000] },
    B: { drawers: [100, 400, 700, 1000], shelves: [] },
    C: { drawers: [100, 400, 700, 1000, 1300], shelves: [] },
    D: { drawers: [100, 400, 700, 1000, 1300, 1600], shelves: [] },
    E: { drawers: [100, 400], shelves: [700, 1000, 1400, 1800] },
    F: { drawers: [100, 400, 700], shelves: [1000, 1400, 1800] },
  };

  const cfg = configs[type];
  for (const y of cfg.drawers) {
    parts.push({ id: id(), type: 'drawer', y, height: DRAWER_HEIGHT });
  }
  for (const y of cfg.shelves) {
    parts.push({ id: id(), type: 'shelf', y, height: SHELF_HEIGHT });
  }
  return parts;
}

// ── 이불장 타입별 내부 부품 ──────────────────────────────────────
export function createBeddingParts(type: ClosetPresetType): UnitPart[] {
  const parts: UnitPart[] = [];
  let idx = 0;
  const id = () => `part-${idx++}`;

  const configs: Record<ClosetPresetType, number[]> = {
    A: [100, 700, 1300, 1900],
    B: [100, 600, 1100, 1600, 2100],
    C: [100, 500, 900, 1300, 1700, 2100],
    D: [100, 400, 700, 1000, 1300, 1600, 1900],
    E: [100, 800, 1500],
    F: [100, 500, 900, 1300, 1700, 2000, 2200],
  };

  for (const y of configs[type]) {
    parts.push({ id: id(), type: 'shelf', y, height: SHELF_HEIGHT });
  }
  return parts;
}

// ── 가구별 부품 생성 ──────────────────────────────────────────
export function createPartsForCategory(
  category: FurnitureCategory,
  type: ClosetPresetType
): UnitPart[] {
  switch (category) {
    case 'wardrobe':
      return createWardrobeParts(type);
    case 'drawer_cabinet':
      return createDrawerCabinetParts(type);
    case 'bedding_cabinet':
      return createBeddingParts(type);
    case 'mirror_cabinet':
      return [];
  }
}

// ── 타입 정보 ──────────────────────────────────────────────────

export const WARDROBE_TYPE_INFO: Record<ClosetPresetType, { label: string; description: string }> = {
  A: { label: 'A타입', description: '봉 + 하단 선반 (긴 옷)' },
  B: { label: 'B타입', description: '봉 + 중간/하단 선반' },
  C: { label: 'C타입', description: '상단 봉 + 중간 봉' },
  D: { label: 'D타입', description: '봉 + 선반 3개' },
  E: { label: 'E타입', description: '상/하단 봉 + 선반 2개' },
  F: { label: 'F타입', description: '봉 + 선반 4개' },
};

export const DRAWER_TYPE_INFO: Record<ClosetPresetType, { label: string; description: string }> = {
  A: { label: 'A타입', description: '서랍 3단 + 상단 선반' },
  B: { label: 'B타입', description: '서랍 4단' },
  C: { label: 'C타입', description: '서랍 5단' },
  D: { label: 'D타입', description: '서랍 6단' },
  E: { label: 'E타입', description: '서랍 2단 + 선반 4개' },
  F: { label: 'F타입', description: '서랍 3단 + 선반 3개' },
};

export const BEDDING_TYPE_INFO: Record<ClosetPresetType, { label: string; description: string }> = {
  A: { label: 'A타입', description: '선반 4단 (넓은 간격)' },
  B: { label: 'B타입', description: '선반 5단' },
  C: { label: 'C타입', description: '선반 6단' },
  D: { label: 'D타입', description: '선반 7단 (좁은 간격)' },
  E: { label: 'E타입', description: '선반 3단 (아주 넓은)' },
  F: { label: 'F타입', description: '선반 7단 (혼합 간격)' },
};

export function getTypeInfoForCategory(category: FurnitureCategory) {
  switch (category) {
    case 'wardrobe': return WARDROBE_TYPE_INFO;
    case 'drawer_cabinet': return DRAWER_TYPE_INFO;
    case 'bedding_cabinet': return BEDDING_TYPE_INFO;
    default: return null;
  }
}

// ══════════════════════════════════════════════════════════════════
// V2 에디터 하위 호환용 내보내기
// ══════════════════════════════════════════════════════════════════

export const PRESET_TYPE_INFO = WARDROBE_TYPE_INFO;

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

function createLegacyPresets(): SystemPreset[] {
  const presets: SystemPreset[] = [];
  const types: ClosetPresetType[] = ['A', 'B', 'C', 'D', 'E', 'F'];
  for (const type of types) {
    for (const width of WIDTH_OPTIONS) {
      presets.push({
        name: `${type}타입 ${width}`,
        category: 'closet_unit',
        presetType: type,
        preset_data: {
          width,
          height: UNIT_HEIGHT,
          depth: UNIT_DEPTH,
          color: '#F5F5F5',
          material: 'metal',
          geometry: 'box',
          parts: createWardrobeParts(type),
        },
        is_system: true,
      });
    }
  }
  return presets;
}

export const SYSTEM_PRESETS: SystemPreset[] = createLegacyPresets();

export interface DressingFurniturePreset {
  id: string;
  name: string;
  furnitureType: DressingFurnitureType;
  icon: string;
  description: string;
  preset_data: {
    width: number;
    height: number;
    depth: number;
    color: string;
    parts: UnitPart[];
  };
}

export const DRESSING_FURNITURE_PRESETS: DressingFurniturePreset[] = [];

export const FURNITURE_TYPE_INFO: Record<string, { label: string; icon: string; description: string }> = {
  closet_unit: { label: '옷장', icon: '', description: '행거/선반 조합' },
  drawer_unit: { label: '서랍장', icon: '', description: '서랍 수납' },
  bedding_unit: { label: '이불장', icon: '', description: '이불/베개 수납' },
  mirror: { label: '거울장', icon: '', description: '전신거울' },
  shoe_rack: { label: '신발장', icon: '', description: '경사 선반' },
  island: { label: '아일랜드', icon: '', description: '중앙 독립가구' },
  accessory_box: { label: '악세서리함', icon: '', description: '소품 수납' },
};
