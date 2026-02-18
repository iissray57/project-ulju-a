import { z } from 'zod';

// 대분류
export const PRODUCT_MAIN_CATEGORIES = ['angle', 'system', 'curtain'] as const;
export type ProductMainCategory = (typeof PRODUCT_MAIN_CATEGORIES)[number];

export const PRODUCT_MAIN_CATEGORY_LABELS: Record<ProductMainCategory, string> = {
  angle: '앵글',
  system: '시스템장',
  curtain: '커튼',
};

// DB enum과 일치하는 소분류 카테고리
export const PRODUCT_CATEGORIES = [
  // 앵글
  'angle',          // 앵글
  'plywood',        // 합판
  'raw_sheet',      // 원장
  // 시스템장
  'system_frame',   // 프레임
  'top_panel',      // 상판
  'drawer',         // 서랍장
  'mirror_cabinet', // 거울장
  // 커튼
  'blind',          // 블라인드
  'curtain',        // 커튼
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  angle: '앵글',
  plywood: '합판',
  raw_sheet: '원장',
  system_frame: '프레임',
  top_panel: '상판',
  drawer: '서랍장',
  mirror_cabinet: '거울장',
  blind: '블라인드',
  curtain: '커튼',
};

// 소분류 → 대분류 매핑
export const CATEGORY_TO_MAIN: Record<ProductCategory, ProductMainCategory> = {
  angle: 'angle',
  plywood: 'angle',
  raw_sheet: 'angle',
  system_frame: 'system',
  top_panel: 'system',
  drawer: 'system',
  mirror_cabinet: 'system',
  blind: 'curtain',
  curtain: 'curtain',
};

// 대분류 → 소분류 그룹
export const MAIN_TO_CATEGORIES: Record<ProductMainCategory, ProductCategory[]> = {
  angle: ['angle', 'plywood', 'raw_sheet'],
  system: ['system_frame', 'top_panel', 'drawer', 'mirror_cabinet'],
  curtain: ['blind', 'curtain'],
};

// 시스템장 프레임 색상
export const FRAME_COLORS = ['화이트', '실버', '골드', '블랙'] as const;
// 상판 색상
export const PANEL_COLORS = ['화이트오크', '메이플', '월넛', '화이트'] as const;

export type FrameColor = (typeof FRAME_COLORS)[number];
export type PanelColor = (typeof PANEL_COLORS)[number];

export const productFormSchema = z.object({
  name: z.string().min(1, '제품명을 입력하세요'),
  category: z.enum(PRODUCT_CATEGORIES),
  sku: z.string().nullish(),
  unit: z.string().nullish(),
  unit_price: z.number().nonnegative().nullish(),
  min_stock: z.number().int().nonnegative().nullish(),
  // 규격 필드
  width: z.number().int().positive().nullish(),   // 가로 (mm)
  depth: z.number().int().positive().nullish(),   // 깊이 (mm)
  height: z.number().int().positive().nullish(),  // 높이 (mm)
  color: z.string().nullish(),                    // 색상
  memo: z.string().nullish(),
  is_active: z.boolean().nullish(),
  supplier_id: z.string().uuid().nullish(),       // 기본 거래처 (선택)
});

export type ProductFormData = z.infer<typeof productFormSchema>;

export interface ProductSearchParams {
  category?: ProductCategory;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  offset?: number;
}
