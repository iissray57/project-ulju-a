// DB ENUM과 정확히 일치하는 수주 상태 정의
export const ORDER_STATUS = [
  'inquiry',
  'quotation_sent',
  'confirmed',
  'measurement_done',
  'date_fixed',
  'material_held',
  'installed',
  'settlement_wait',
  'revenue_confirmed',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUS)[number];

// 상태 전이 규칙: key → 이동 가능한 상태 배열
// 정방향 + 역방향(직전 상태로만) + 어디서든 cancelled
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  inquiry: ['quotation_sent', 'cancelled'],
  quotation_sent: ['confirmed', 'inquiry', 'cancelled'],
  confirmed: ['measurement_done', 'quotation_sent', 'cancelled'],
  measurement_done: ['date_fixed', 'confirmed', 'cancelled'],
  date_fixed: ['material_held', 'measurement_done', 'cancelled'],
  material_held: ['installed', 'date_fixed', 'cancelled'],
  installed: ['settlement_wait', 'material_held', 'cancelled'],
  settlement_wait: ['revenue_confirmed', 'installed', 'cancelled'],
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
  quotation_sent: '견적 발송',
  confirmed: '수주 확정',
  measurement_done: '실측 완료',
  date_fixed: '일자 확정',
  material_held: '자재 준비',
  installed: '설치 완료',
  settlement_wait: '정산 대기',
  revenue_confirmed: '매출 확정',
  cancelled: '취소',
};

// 상태별 색상 (Tailwind classes)
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  inquiry: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  quotation_sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  measurement_done: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  date_fixed: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  material_held: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  installed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  settlement_wait: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  revenue_confirmed: 'bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};
