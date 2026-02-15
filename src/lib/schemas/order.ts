import { z } from 'zod';
import { closetSpecSchema } from './closet-spec';

// 주문 생성/수정 폼 스키마
export const orderFormSchema = z.object({
  customer_id: z.string().optional(), // 신규 고객 등록 시 빈 값 허용
  closet_type: z.enum(['angle', 'system', 'mixed']).optional(),
  closet_spec: closetSpecSchema.optional(),
  quotation_amount: z.number().nonnegative(),
  confirmed_amount: z.number().nonnegative(),
  measurement_date: z.string().min(1, '실측일을 입력하세요'), // 필수
  installation_date: z.string().optional(), // 미정 가능
  site_address: z.string().optional(),
  site_memo: z.string().optional(),
  memo: z.string().optional(),
});

export type OrderFormData = z.infer<typeof orderFormSchema>;
