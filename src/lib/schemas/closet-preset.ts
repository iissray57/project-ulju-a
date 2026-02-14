import { z } from 'zod';

// 프리셋 데이터 스키마 (Three.js 씬 데이터)
export const presetDataSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
  color: z.string().optional(),
  material: z.string().optional(),
  geometry: z.enum(['box', 'cylinder', 'custom']).optional(),
});

export type PresetData = z.infer<typeof presetDataSchema>;

// 프리셋 카테고리 (product_category enum에 맞춤)
export const PRESET_CATEGORIES = [
  { value: 'angle_frame', label: '앵글 프레임' },
  { value: 'system_frame', label: '시스템 프레임' },
  { value: 'hanger_bar', label: '행거 바' },
  { value: 'shelf', label: '선반' },
  { value: 'drawer', label: '서랍' },
  { value: 'door', label: '도어' },
  { value: 'accessory', label: '악세서리' },
  { value: 'etc', label: '기타' },
] as const;

export const closetPresetFormSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요'),
  category: z.string().min(1, '카테고리를 선택하세요'),
  preset_data: presetDataSchema,
});

export type ClosetPresetFormData = z.infer<typeof closetPresetFormSchema>;
