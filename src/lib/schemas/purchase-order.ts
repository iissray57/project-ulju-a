import { z } from 'zod';

// 발주 생성/수정 폼 스키마
export const purchaseOrderFormSchema = z.object({
  supplier_name: z.string().min(1, '공급업체명을 입력해주세요').optional(),
  supplier_phone: z.string().optional(),
  total_amount: z.number().nonnegative(),
  payment_date: z.string().optional(), // ISO date string
  memo: z.string().optional(),
});

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderFormSchema>;

// 발주 품목 스키마
export const purchaseOrderItemSchema = z.object({
  product_id: z.string().uuid().optional(),
  quantity: z.number().int().positive('수량은 1 이상이어야 합니다'),
  unit_price: z.number().nonnegative(),
  memo: z.string().optional(),
});

export type PurchaseOrderItemData = z.infer<typeof purchaseOrderItemSchema>;

// DB ENUM과 정확히 일치하는 발주 상태 정의
export const PO_STATUS = ['draft', 'ordered', 'received', 'settled', 'cost_confirmed'] as const;

export type PoStatus = (typeof PO_STATUS)[number];

// 상태 전이 규칙: key → 이동 가능한 상태 배열
export const PO_TRANSITIONS: Record<PoStatus, PoStatus[]> = {
  draft: ['ordered'],
  ordered: ['received', 'draft'], // 역방향 가능
  received: ['settled', 'ordered'],
  settled: ['cost_confirmed', 'received'],
  cost_confirmed: [], // 최종 상태, 전이 불가
};

// 상태 전이 가능 여부 검증
export function canTransitionPO(from: PoStatus, to: PoStatus): boolean {
  return PO_TRANSITIONS[from].includes(to);
}

// 상태 한글 라벨
export const PO_STATUS_LABELS: Record<PoStatus, string> = {
  draft: '임시저장',
  ordered: '발주',
  received: '입고',
  settled: '정산',
  cost_confirmed: '원가 확정',
};

// 상태별 색상 (Tailwind classes)
export const PO_STATUS_COLORS: Record<PoStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  ordered: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  received: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  settled: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  cost_confirmed: 'bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300',
};
