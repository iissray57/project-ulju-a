import { z } from 'zod';

/**
 * 주문별 자재 등록/수정 폼 스키마
 */
export const orderMaterialSchema = z.object({
  order_id: z.string().uuid('유효하지 않은 주문 ID입니다'),
  product_id: z.string().uuid('유효하지 않은 제품 ID입니다'),
  planned_quantity: z
    .number()
    .int('정수만 입력 가능합니다')
    .nonnegative('0 이상의 값을 입력해주세요'),
  memo: z.string().optional(),
});

export type OrderMaterialFormData = z.infer<typeof orderMaterialSchema>;
