import { z } from 'zod';
import { closetSpecSchema } from './closet-spec';

// 수주 생성/수정 폼 스키마
export const orderFormSchema = z.object({
  customer_id: z.string().uuid(),
  closet_type: z.enum(['angle', 'system', 'mixed']).optional(),
  closet_spec: closetSpecSchema.optional(),
  quotation_amount: z.number().nonnegative(),
  confirmed_amount: z.number().nonnegative(),
  measurement_date: z.string().optional(), // ISO date string
  installation_date: z.string().optional(),
  site_address: z.string().optional(),
  site_memo: z.string().optional(),
  memo: z.string().optional(),
});

export type OrderFormData = z.infer<typeof orderFormSchema>;
