import { z } from 'zod';

export const supplierSchema = z.object({
  name: z.string().min(1, '거래처명을 입력하세요'),
  phone: z.string().optional(),
  address: z.string().optional(),
  business_number: z.string().optional(),
  contact_person: z.string().optional(),
  memo: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

export interface SupplierSearchParams {
  query?: string;
  isActive?: boolean;
  offset?: number;
  limit?: number;
}
