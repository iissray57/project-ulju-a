import { z } from 'zod';
import { workSpecSchema } from './work-spec';

// 작업 유형
export const WORK_TYPES = ['angle', 'system', 'mixed', 'curtain', 'demolition'] as const;
export type WorkType = (typeof WORK_TYPES)[number];

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  angle: '앵글형',
  system: '시스템형',
  mixed: '혼합형',
  curtain: '커튼 설치',
  demolition: '철거',
};

// 결제 수단
export const PAYMENT_METHODS = ['bank_transfer', 'cash', 'card'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: '계좌이체',
  cash: '현금',
  card: '카드',
};

// 주문 생성/수정 폼 스키마
export const orderFormSchema = z.object({
  customer_id: z.string().optional(), // 신규 고객 등록 시 빈 값 허용
  work_type: z.enum(WORK_TYPES).optional(),
  work_spec: workSpecSchema.optional(),
  quotation_amount: z.number().nonnegative(),
  confirmed_amount: z.number().nonnegative(),
  measurement_date: z.string().min(1, '실측일을 입력하세요'), // 필수
  installation_date: z.string().optional(), // 미정 가능
  site_address: z.string().optional(),
  site_memo: z.string().optional(),
  memo: z.string().optional(),
  payment_method: z.enum(PAYMENT_METHODS).optional(),
  settlement_memo: z.string().optional(),
});

export type OrderFormData = z.infer<typeof orderFormSchema>;
