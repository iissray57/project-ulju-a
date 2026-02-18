import type { RackProductType } from './data/rack-products';
import type { RackOptionType } from './data/rack-options';

/** Virtual background environment */
export type VirtualBackground = 'empty' | 'dressing_room' | 'veranda' | 'laundry_room';

export const VIRTUAL_BACKGROUNDS: Record<VirtualBackground, { name: string; icon: string }> = {
  empty: { name: '빈 방', icon: '🏠' },
  dressing_room: { name: '드레스룸', icon: '👗' },
  veranda: { name: '베란다', icon: '🌿' },
  laundry_room: { name: '세탁실', icon: '🧺' },
};

/** Camera mode */
export type CameraMode = 'fixed' | 'free';

/** A single rack item in the scene */
export interface RackItem {
  id: string;
  productType: RackProductType;
  name: string;
  width: number;
  depth: number;
  height: number;
  shelfCount: number;
  options: RackOptionType[];
  baseType: 'leveling_foot' | 'small_wheel' | 'large_wheel';
  color: string;
  rotation: number; // degrees (0, 90, 180, 270)
}

/** Frame colors available */
export type RackFrameColor = 'silver' | 'black' | 'white' | 'ivory';

export const RACK_FRAME_COLORS: Record<RackFrameColor, { name: string; hex: string }> = {
  silver: { name: '실버', hex: '#C0C0C0' },
  black: { name: '블랙', hex: '#333333' },
  white: { name: '화이트', hex: '#F0F0F0' },
  ivory: { name: '아이보리', hex: '#FFFFF0' },
};
