// 간소화된 주문 상태 (6단계 + 취소)
// 의뢰 → 실측 → 견적발송 → 확정(작업일+할인) → 작업완료(입금대기) → 매출확정
export const ORDER_STATUS = [
  'inquiry',           // 의뢰/등록
  'measurement',       // 실측 완료
  'quotation_sent',    // 견적 발송
  'confirmed',         // 확정 (작업예정일 + 할인 적용)
  'completed',         // 작업 완료 (입금 대기)
  'revenue_confirmed', // 매출 확정 (입금 완료)
  'cancelled',         // 취소
] as const;

export type OrderStatus = (typeof ORDER_STATUS)[number];

// 상태 전이 규칙: key → 이동 가능한 상태 배열
// 정방향 + 역방향(직전 상태로만) + 어디서든 cancelled
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  inquiry: ['measurement', 'cancelled'],
  measurement: ['quotation_sent', 'inquiry', 'cancelled'],
  quotation_sent: ['confirmed', 'measurement', 'cancelled'],
  confirmed: ['completed', 'quotation_sent', 'cancelled'],
  completed: ['revenue_confirmed', 'confirmed', 'cancelled'],
  revenue_confirmed: [], // 최종 상태, 전이 불가
  cancelled: [], // 최종 상태, 전이 불가
};

// 상태 전이 가능 여부 검증
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

// 상태 한글 라벨
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  inquiry: '의뢰',
  measurement: '실측',
  quotation_sent: '견적 발송',
  confirmed: '확정',
  completed: '작업 완료',
  revenue_confirmed: '매출 확정',
  cancelled: '취소',
};

// 상태별 색상 (Tailwind classes)
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  inquiry: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  measurement: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  quotation_sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  revenue_confirmed: 'bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

// 이전 상태를 새 상태로 매핑 (마이그레이션용)
export const LEGACY_STATUS_MAP: Record<string, OrderStatus> = {
  inquiry: 'inquiry',
  measurement_done: 'measurement',
  quotation_sent: 'quotation_sent',
  confirmed: 'confirmed',
  date_fixed: 'confirmed',
  material_held: 'confirmed',
  installed: 'completed',
  settlement_wait: 'completed',
  revenue_confirmed: 'revenue_confirmed',
  cancelled: 'cancelled',
};
