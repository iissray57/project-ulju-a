import { z } from 'zod';

// 매출 확정 기록 폼 스키마
export const revenueFormSchema = z.object({
  order_id: z.string().uuid().optional(),
  confirmed_amount: z.number().nonnegative(),
  confirmed_at: z.string().optional(), // ISO date string
  payment_date: z.string().optional(), // ISO date string
  payment_method: z.string().optional(),
  memo: z.string().optional(),
});

// 매입 확정 기록 폼 스키마
export const costFormSchema = z.object({
  purchase_order_id: z.string().uuid().optional(),
  order_id: z.string().uuid().optional(),
  confirmed_amount: z.number().nonnegative(),
  confirmed_at: z.string().optional(), // ISO date string
  payment_date: z.string().optional(), // ISO date string
  payment_method: z.string().optional(),
  memo: z.string().optional(),
});

// 기간별 집계 주기
export const FINANCE_SUMMARY_PERIOD = ['monthly', 'quarterly', 'yearly'] as const;
export type FinanceSummaryPeriod = (typeof FINANCE_SUMMARY_PERIOD)[number];

export type RevenueFormData = z.infer<typeof revenueFormSchema>;
export type CostFormData = z.infer<typeof costFormSchema>;
