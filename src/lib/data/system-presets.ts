/**
 * 시스템 기본 프리셋 데이터
 * 실제 울슈앵글 제품 사양 기반
 *
 * 앵글: 10cm 단위, 깊이 300~600mm, 가로 300~1500mm
 * 시스템장: 깊이 400mm 고정, 가로 300~900mm
 */

import type { PresetData } from '@/lib/schemas/closet-preset';

// 프레임 색상 (시스템장)
export const FRAME_COLORS = {
  silver: { name: '실버', hex: '#C0C0C0' },
  white: { name: '화이트', hex: '#FFFFFF' },
  gold: { name: '골드', hex: '#D4AF37' },
  black: { name: '블랙', hex: '#333333' },
} as const;

// 상판 색상
export const TOP_COLORS = {
  whiteOak: { name: '화이트오크', hex: '#E8DCC4' },
  maple: { name: '메이플', hex: '#F5DEB3' },
  walnut: { name: '월넛', hex: '#5D432C' },
  white: { name: '화이트', hex: '#FAFAFA' },
} as const;

// 앵글 프레임 색상
export const ANGLE_COLORS = {
  silver: { name: '실버', hex: '#C0C0C0' },
  white: { name: '화이트', hex: '#E8E8E8' },
} as const;

export interface SystemPreset {
  name: string;
  category: string;
  preset_data: PresetData;
  is_system: true;
}

export const SYSTEM_PRESETS: SystemPreset[] = [
  // ═══════════════════════════════════════════════════════════
  // 앵글 프레임 (깊이 300~600, 가로 300~1500, 10cm 단위)
  // ═══════════════════════════════════════════════════════════

  // 깊이 300mm
  {
    name: '앵글 프레임 600×2400×300',
    category: 'angle_frame',
    preset_data: {
      width: 600,
      height: 2400,
      depth: 300,
      color: ANGLE_COLORS.silver.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '앵글 프레임 900×2400×300',
    category: 'angle_frame',
    preset_data: {
      width: 900,
      height: 2400,
      depth: 300,
      color: ANGLE_COLORS.silver.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '앵글 프레임 1200×2400×300',
    category: 'angle_frame',
    preset_data: {
      width: 1200,
      height: 2400,
      depth: 300,
      color: ANGLE_COLORS.silver.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '앵글 프레임 1500×2400×300',
    category: 'angle_frame',
    preset_data: {
      width: 1500,
      height: 2400,
      depth: 300,
      color: ANGLE_COLORS.silver.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },

  // 깊이 400mm
  {
    name: '앵글 프레임 600×2400×400',
    category: 'angle_frame',
    preset_data: {
      width: 600,
      height: 2400,
      depth: 400,
      color: ANGLE_COLORS.silver.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '앵글 프레임 900×2400×400',
    category: 'angle_frame',
    preset_data: {
      width: 900,
      height: 2400,
      depth: 400,
      color: ANGLE_COLORS.silver.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '앵글 프레임 1200×2400×400',
    category: 'angle_frame',
    preset_data: {
      width: 1200,
      height: 2400,
      depth: 400,
      color: ANGLE_COLORS.silver.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '앵글 프레임 1500×2400×400',
    category: 'angle_frame',
    preset_data: {
      width: 1500,
      height: 2400,
      depth: 400,
      color: ANGLE_COLORS.silver.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },

  // 깊이 500mm
  {
    name: '앵글 프레임 600×2400×500',
    category: 'angle_frame',
    preset_data: {
      width: 600,
      height: 2400,
      depth: 500,
      color: ANGLE_COLORS.silver.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '앵글 프레임 900×2400×500',
    category: 'angle_frame',
    preset_data: {
      width: 900,
      height: 2400,
      depth: 500,
      color: ANGLE_COLORS.silver.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '앵글 프레임 1200×2400×500',
    category: 'angle_frame',
    preset_data: {
      width: 1200,
      height: 2400,
      depth: 500,
      color: ANGLE_COLORS.silver.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '앵글 프레임 1500×2400×500',
    category: 'angle_frame',
    preset_data: {
      width: 1500,
      height: 2400,
      depth: 500,
      color: ANGLE_COLORS.silver.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },

  // 깊이 600mm
  {
    name: '앵글 프레임 600×2400×600',
    category: 'angle_frame',
    preset_data: {
      width: 600,
      height: 2400,
      depth: 600,
      color: ANGLE_COLORS.silver.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '앵글 프레임 900×2400×600',
    category: 'angle_frame',
    preset_data: {
      width: 900,
      height: 2400,
      depth: 600,
      color: ANGLE_COLORS.silver.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '앵글 프레임 1200×2400×600',
    category: 'angle_frame',
    preset_data: {
      width: 1200,
      height: 2400,
      depth: 600,
      color: ANGLE_COLORS.silver.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '앵글 프레임 1500×2400×600',
    category: 'angle_frame',
    preset_data: {
      width: 1500,
      height: 2400,
      depth: 600,
      color: ANGLE_COLORS.silver.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },

  // ═══════════════════════════════════════════════════════════
  // 시스템 프레임 (깊이 400mm 고정, 가로 300~900)
  // ═══════════════════════════════════════════════════════════
  {
    name: '시스템 프레임 300×2400×400 (실버)',
    category: 'system_frame',
    preset_data: {
      width: 300,
      height: 2400,
      depth: 400,
      color: FRAME_COLORS.silver.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '시스템 프레임 300×2400×400 (화이트)',
    category: 'system_frame',
    preset_data: {
      width: 300,
      height: 2400,
      depth: 400,
      color: FRAME_COLORS.white.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '시스템 프레임 300×2400×400 (골드)',
    category: 'system_frame',
    preset_data: {
      width: 300,
      height: 2400,
      depth: 400,
      color: FRAME_COLORS.gold.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '시스템 프레임 300×2400×400 (블랙)',
    category: 'system_frame',
    preset_data: {
      width: 300,
      height: 2400,
      depth: 400,
      color: FRAME_COLORS.black.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '시스템 프레임 600×2400×400 (실버)',
    category: 'system_frame',
    preset_data: {
      width: 600,
      height: 2400,
      depth: 400,
      color: FRAME_COLORS.silver.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '시스템 프레임 600×2400×400 (화이트)',
    category: 'system_frame',
    preset_data: {
      width: 600,
      height: 2400,
      depth: 400,
      color: FRAME_COLORS.white.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '시스템 프레임 600×2400×400 (골드)',
    category: 'system_frame',
    preset_data: {
      width: 600,
      height: 2400,
      depth: 400,
      color: FRAME_COLORS.gold.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '시스템 프레임 600×2400×400 (블랙)',
    category: 'system_frame',
    preset_data: {
      width: 600,
      height: 2400,
      depth: 400,
      color: FRAME_COLORS.black.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '시스템 프레임 900×2400×400 (실버)',
    category: 'system_frame',
    preset_data: {
      width: 900,
      height: 2400,
      depth: 400,
      color: FRAME_COLORS.silver.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '시스템 프레임 900×2400×400 (화이트)',
    category: 'system_frame',
    preset_data: {
      width: 900,
      height: 2400,
      depth: 400,
      color: FRAME_COLORS.white.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '시스템 프레임 900×2400×400 (골드)',
    category: 'system_frame',
    preset_data: {
      width: 900,
      height: 2400,
      depth: 400,
      color: FRAME_COLORS.gold.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '시스템 프레임 900×2400×400 (블랙)',
    category: 'system_frame',
    preset_data: {
      width: 900,
      height: 2400,
      depth: 400,
      color: FRAME_COLORS.black.hex,
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },

  // ═══════════════════════════════════════════════════════════
  // 행거 바
  // ═══════════════════════════════════════════════════════════
  {
    name: '행거 바 600×50×50',
    category: 'hanger_bar',
    preset_data: {
      width: 600,
      height: 50,
      depth: 50,
      color: '#C0C0C0',
      material: 'metal',
      geometry: 'cylinder',
    },
    is_system: true,
  },
  {
    name: '행거 바 900×50×50',
    category: 'hanger_bar',
    preset_data: {
      width: 900,
      height: 50,
      depth: 50,
      color: '#C0C0C0',
      material: 'metal',
      geometry: 'cylinder',
    },
    is_system: true,
  },
  {
    name: '행거 바 1200×50×50',
    category: 'hanger_bar',
    preset_data: {
      width: 1200,
      height: 50,
      depth: 50,
      color: '#C0C0C0',
      material: 'metal',
      geometry: 'cylinder',
    },
    is_system: true,
  },
  {
    name: '행거 바 1500×50×50',
    category: 'hanger_bar',
    preset_data: {
      width: 1500,
      height: 50,
      depth: 50,
      color: '#C0C0C0',
      material: 'metal',
      geometry: 'cylinder',
    },
    is_system: true,
  },

  // ═══════════════════════════════════════════════════════════
  // 선반 (앵글용 - 깊이별)
  // ═══════════════════════════════════════════════════════════
  {
    name: '선반 600×25×300 (화이트오크)',
    category: 'shelf',
    preset_data: {
      width: 600,
      height: 25,
      depth: 300,
      color: TOP_COLORS.whiteOak.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '선반 900×25×300 (화이트오크)',
    category: 'shelf',
    preset_data: {
      width: 900,
      height: 25,
      depth: 300,
      color: TOP_COLORS.whiteOak.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '선반 1200×25×300 (화이트오크)',
    category: 'shelf',
    preset_data: {
      width: 1200,
      height: 25,
      depth: 300,
      color: TOP_COLORS.whiteOak.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '선반 600×25×400 (화이트오크)',
    category: 'shelf',
    preset_data: {
      width: 600,
      height: 25,
      depth: 400,
      color: TOP_COLORS.whiteOak.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '선반 900×25×400 (화이트오크)',
    category: 'shelf',
    preset_data: {
      width: 900,
      height: 25,
      depth: 400,
      color: TOP_COLORS.whiteOak.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '선반 600×25×400 (메이플)',
    category: 'shelf',
    preset_data: {
      width: 600,
      height: 25,
      depth: 400,
      color: TOP_COLORS.maple.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '선반 600×25×400 (월넛)',
    category: 'shelf',
    preset_data: {
      width: 600,
      height: 25,
      depth: 400,
      color: TOP_COLORS.walnut.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '선반 600×25×400 (화이트)',
    category: 'shelf',
    preset_data: {
      width: 600,
      height: 25,
      depth: 400,
      color: TOP_COLORS.white.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },

  // ═══════════════════════════════════════════════════════════
  // 서랍장 (시스템용 - 가로 800mm 고정)
  // ═══════════════════════════════════════════════════════════
  {
    name: '서랍장 2단 800×400×400 (화이트오크)',
    category: 'drawer',
    preset_data: {
      width: 800,
      height: 400,
      depth: 400,
      color: TOP_COLORS.whiteOak.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '서랍장 3단 800×600×400 (화이트오크)',
    category: 'drawer',
    preset_data: {
      width: 800,
      height: 600,
      depth: 400,
      color: TOP_COLORS.whiteOak.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '서랍장 4단 800×800×400 (화이트오크)',
    category: 'drawer',
    preset_data: {
      width: 800,
      height: 800,
      depth: 400,
      color: TOP_COLORS.whiteOak.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '서랍장 2단 800×400×400 (메이플)',
    category: 'drawer',
    preset_data: {
      width: 800,
      height: 400,
      depth: 400,
      color: TOP_COLORS.maple.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '서랍장 3단 800×600×400 (메이플)',
    category: 'drawer',
    preset_data: {
      width: 800,
      height: 600,
      depth: 400,
      color: TOP_COLORS.maple.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '서랍장 4단 800×800×400 (메이플)',
    category: 'drawer',
    preset_data: {
      width: 800,
      height: 800,
      depth: 400,
      color: TOP_COLORS.maple.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '서랍장 2단 800×400×400 (월넛)',
    category: 'drawer',
    preset_data: {
      width: 800,
      height: 400,
      depth: 400,
      color: TOP_COLORS.walnut.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '서랍장 3단 800×600×400 (월넛)',
    category: 'drawer',
    preset_data: {
      width: 800,
      height: 600,
      depth: 400,
      color: TOP_COLORS.walnut.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '서랍장 4단 800×800×400 (월넛)',
    category: 'drawer',
    preset_data: {
      width: 800,
      height: 800,
      depth: 400,
      color: TOP_COLORS.walnut.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '서랍장 2단 800×400×400 (화이트)',
    category: 'drawer',
    preset_data: {
      width: 800,
      height: 400,
      depth: 400,
      color: TOP_COLORS.white.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '서랍장 3단 800×600×400 (화이트)',
    category: 'drawer',
    preset_data: {
      width: 800,
      height: 600,
      depth: 400,
      color: TOP_COLORS.white.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '서랍장 4단 800×800×400 (화이트)',
    category: 'drawer',
    preset_data: {
      width: 800,
      height: 800,
      depth: 400,
      color: TOP_COLORS.white.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },

  // ═══════════════════════════════════════════════════════════
  // 거울장 (가로 400mm)
  // ═══════════════════════════════════════════════════════════
  {
    name: '거울장 400×1800×50',
    category: 'accessory',
    preset_data: {
      width: 400,
      height: 1800,
      depth: 50,
      color: '#E8E8E8',
      material: 'glass',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '거울장 400×1500×50',
    category: 'accessory',
    preset_data: {
      width: 400,
      height: 1500,
      depth: 50,
      color: '#E8E8E8',
      material: 'glass',
      geometry: 'box',
    },
    is_system: true,
  },

  // ═══════════════════════════════════════════════════════════
  // 악세서리 (트레이, 바지걸이 등)
  // ═══════════════════════════════════════════════════════════
  {
    name: '칸막이 트레이 400×100×400',
    category: 'accessory',
    preset_data: {
      width: 400,
      height: 100,
      depth: 400,
      color: TOP_COLORS.whiteOak.hex,
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '바지걸이 600×50×400',
    category: 'accessory',
    preset_data: {
      width: 600,
      height: 50,
      depth: 400,
      color: '#C0C0C0',
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
];
