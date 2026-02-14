import { z } from 'zod';

export const PRODUCT_CATEGORIES = [
  'angle_frame',
  'system_frame',
  'shelf',
  'hanger_bar',
  'drawer',
  'door',
  'hardware',
  'accessory',
  'etc',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  angle_frame: '앵글 프레임',
  system_frame: '시스템 프레임',
  shelf: '선반',
  hanger_bar: '행거봉',
  drawer: '서랍',
  door: '문짝',
  hardware: '하드웨어',
  accessory: '부속품',
  etc: '기타',
};

export const productFormSchema = z.object({
  name: z.string().min(1, '제품명을 입력하세요'),
  category: z.enum(PRODUCT_CATEGORIES),
  sku: z.string().optional(),
  unit: z.string().default('EA'),
  unit_price: z.number().nonnegative().default(0),
  min_stock: z.number().int().nonnegative().default(0),
  memo: z.string().optional(),
  is_active: z.boolean().default(true),
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
