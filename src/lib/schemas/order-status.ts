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
