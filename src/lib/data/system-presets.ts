/**
 * 시스템 기본 프리셋 데이터
 * 나중에 Supabase seed로 삽입하거나 앱에서 초기화
 */

import type { PresetData } from '@/lib/schemas/closet-preset';

export interface SystemPreset {
  name: string;
  category: string;
  preset_data: PresetData;
  is_system: true;
}

export const SYSTEM_PRESETS: SystemPreset[] = [
  // 앵글 프레임
  {
    name: '앵글 프레임 600x2400x450',
    category: 'angle_frame',
    preset_data: {
      width: 600,
      height: 2400,
      depth: 450,
      color: '#CCCCCC',
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '앵글 프레임 900x2400x450',
    category: 'angle_frame',
    preset_data: {
      width: 900,
      height: 2400,
      depth: 450,
      color: '#CCCCCC',
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '앵글 프레임 1200x2400x450',
    category: 'angle_frame',
    preset_data: {
      width: 1200,
      height: 2400,
      depth: 450,
      color: '#CCCCCC',
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },

  // 시스템 프레임
  {
    name: '시스템 프레임 600x2400x600',
    category: 'system_frame',
    preset_data: {
      width: 600,
      height: 2400,
      depth: 600,
      color: '#FFFFFF',
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '시스템 프레임 900x2400x600',
    category: 'system_frame',
    preset_data: {
      width: 900,
      height: 2400,
      depth: 600,
      color: '#FFFFFF',
      material: 'metal',
      geometry: 'box',
    },
    is_system: true,
  },

  // 행거 바
  {
    name: '행거 바 900x50x50',
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
    name: '행거 바 1200x50x50',
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

  // 선반
  {
    name: '선반 900x25x450',
    category: 'shelf',
    preset_data: {
      width: 900,
      height: 25,
      depth: 450,
      color: '#8B7355',
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
  {
    name: '선반 1200x25x450',
    category: 'shelf',
    preset_data: {
      width: 1200,
      height: 25,
      depth: 450,
      color: '#8B7355',
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },

  // 서랍
  {
    name: '서랍 600x200x450',
    category: 'drawer',
    preset_data: {
      width: 600,
      height: 200,
      depth: 450,
      color: '#D2B48C',
      material: 'wood',
      geometry: 'box',
    },
    is_system: true,
  },
];
