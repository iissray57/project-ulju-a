import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, '고객명을 입력해주세요'),
  phone: z.string().min(1, '연락처를 입력해주세요'),
  address: z.string().optional(),
  address_detail: z.string().optional(),
  memo: z.string().optional(),
});

export const customerSearchParamsSchema = z.object({
  query: z.string().optional(),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type CustomerSearchParams = z.infer<typeof customerSearchParamsSchema>;
