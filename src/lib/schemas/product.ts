import { z } from 'zod';

// DB enum과 일치하는 카테고리 (Supabase product_category)
export const PRODUCT_CATEGORIES = [
  'angle_frame',    // 앵글 프레임 (드레스룸)
  'system_frame',   // 시스템 프레임 (시스템장)
  'top_panel',      // 상판
  'shelf',          // 선반
  'hanger_bar',     // 행거봉
  'drawer',         // 서랍장
  'mirror',         // 거울/거울장
  'door',           // 문짝
  'lighting',       // 조명 (LED 바 등)
  'tray',           // 트레이/칸막이
  'hardware',       // 하드웨어 (경첩, 손잡이 등)
  'accessory',      // 액세서리
  'etc',            // 기타
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  angle_frame: '앵글 프레임',
  system_frame: '시스템 프레임',
  top_panel: '상판',
  shelf: '선반',
  hanger_bar: '행거봉',
  drawer: '서랍장',
  mirror: '거울/거울장',
  door: '문짝',
  lighting: '조명',
  tray: '트레이/칸막이',
  hardware: '하드웨어',
  accessory: '액세서리',
  etc: '기타',
};

// 프레임/상판 색상
export const FRAME_COLORS = ['실버', '화이트', '골드', '블랙'] as const;
export const PANEL_COLORS = ['화이트오크', '메이플', '월넷', '화이트'] as const;
export const DRAWER_COLORS = ['화이트', '웜그레이', '오크'] as const;

export type FrameColor = (typeof FRAME_COLORS)[number];
export type PanelColor = (typeof PANEL_COLORS)[number];
export type DrawerColor = (typeof DRAWER_COLORS)[number];

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
