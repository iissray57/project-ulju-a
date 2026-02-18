// 주문 상태 (5단계 + 취소)
// inquiry(의뢰/실측) → quotation(견적) → work(작업) → settlement_wait(정산대기) → revenue_confirmed(매출확정)
export const ORDER_STATUS = [
  'inquiry',           // 의뢰/실측
  'quotation',         // 견적
  'work',              // 작업
  'settlement_wait',   // 정산 대기
  'revenue_confirmed', // 매출 확정
  'cancelled',         // 취소
] as const;

export type OrderStatus = (typeof ORDER_STATUS)[number];

// 상태 전이 규칙 (정방향 + 역방향 + 취소)
export const ORDER_TRANSITIONS: Record<OrderStatus, {
  forward: OrderStatus[];
  backward: OrderStatus[];
  conditions?: string[];
  sideEffects?: string[];
}> = {
  inquiry: {
    forward: ['quotation', 'cancelled'],
    backward: [],
    conditions: ['견적 금액 입력 필수'],
  },
  quotation: {
    forward: ['work', 'cancelled'],
    backward: ['inquiry'],
    conditions: ['확정 금액 입력 필수', '작업일 확정'],
  },
  work: {
    forward: ['settlement_wait', 'cancelled'],
    backward: ['quotation'],
    conditions: ['작업 완료 확인'],
  },
  settlement_wait: {
    forward: ['revenue_confirmed'],
    backward: ['work'],
    conditions: ['입금 확인'],
  },
  revenue_confirmed: {
    forward: [],
    backward: [],
  },
  cancelled: {
    forward: [],
    backward: [],
    sideEffects: ['cancel_order_cascade RPC 호출'],
  },
};

// 상태 전이 가능 여부 검증
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  const transitions = ORDER_TRANSITIONS[from];
  return transitions.forward.includes(to) || transitions.backward.includes(to);
}

// 정방향 전이 가능 여부
export function canTransitionForward(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].forward.includes(to);
}

// 역방향 전이 가능 여부
export function canTransitionBackward(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].backward.includes(to);
}

// 상태 한글 라벨
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  inquiry: '의뢰/실측',
  quotation: '견적',
  work: '작업',
  settlement_wait: '정산 대기',
  revenue_confirmed: '매출 확정',
  cancelled: '취소',
};

// 상태별 색상
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  inquiry: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  quotation: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  work: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  settlement_wait: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  revenue_confirmed: 'bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

// 기존 DB 상태 → 새 상태 매핑 (마이그레이션 전 호환성)
const LEGACY_STATUS_MAP: Record<string, OrderStatus> = {
  inquiry: 'inquiry',
  measurement_done: 'inquiry',
  quotation_sent: 'quotation',
  confirmed: 'quotation',
  date_fixed: 'work',
  material_held: 'work',
  installed: 'work',
  settlement_wait: 'settlement_wait',
  revenue_confirmed: 'revenue_confirmed',
  cancelled: 'cancelled',
  // 새 상태도 포함
  quotation: 'quotation',
  work: 'work',
};

/**
 * DB에서 가져온 상태를 새 5단계 상태로 매핑
 */
export function mapDbStatus(dbStatus: string | null): OrderStatus {
  if (!dbStatus) return 'inquiry';
  return LEGACY_STATUS_MAP[dbStatus] || 'inquiry';
}

/**
 * 상태 라벨 가져오기 (DB 상태 호환)
 */
export function getStatusLabel(status: string | null): string {
  const mapped = mapDbStatus(status);
  return ORDER_STATUS_LABELS[mapped];
}

/**
 * 상태 색상 가져오기 (DB 상태 호환)
 */
export function getStatusColor(status: string | null): string {
  const mapped = mapDbStatus(status);
  return ORDER_STATUS_COLORS[mapped];
}
