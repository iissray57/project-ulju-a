'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  type OrderStatus,
} from '@/lib/schemas/order-status';
import type { OrderWithCustomer } from '@/app/(dashboard)/orders/actions';

interface OrderTimelineViewProps {
  orders: OrderWithCustomer[];
}

// 날짜별 그룹화 (최신순)
function groupByDate(orders: OrderWithCustomer[]): Map<string, OrderWithCustomer[]> {
  const grouped = new Map<string, OrderWithCustomer[]>();

  for (const order of orders) {
    if (!order.created_at) continue; // null 처리
    const dateKey = order.created_at.split('T')[0]; // YYYY-MM-DD
    const existing = grouped.get(dateKey) || [];
    grouped.set(dateKey, [...existing, order]);
  }

  // Map을 배열로 변환 후 날짜 내림차순 정렬
  const sortedEntries = Array.from(grouped.entries()).sort((a, b) =>
    b[0].localeCompare(a[0])
  );

  return new Map(sortedEntries);
}

// 날짜 포맷: "2024년 2월 14일 (금)"
function formatDateHeader(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

// 금액 포맷: "₩350만"
function formatCurrency(amount: number): string {
  const manWon = amount / 10000;
  return `₩${manWon.toFixed(0)}만`;
}

// 주요 일정 추출 (상태별 우선순위)
function getPrimaryDate(order: OrderWithCustomer): string | null {
  const status = order.status as OrderStatus;

  // measurement_done 이상이면 installation_date 우선
  if (
    ['measurement_done', 'date_fixed', 'material_held', 'installed'].includes(status) &&
    order.installation_date
  ) {
    return `설치: ${new Date(order.installation_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`;
  }

  // confirmed 이상이면 measurement_date 우선
  if (['confirmed', 'measurement_done'].includes(status) && order.measurement_date) {
    return `실측: ${new Date(order.measurement_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`;
  }

  return null;
}

export function OrderTimelineView({ orders }: OrderTimelineViewProps) {
  const router = useRouter();
  const grouped = groupByDate(orders);

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        표시할 수주가 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([date, dayOrders]) => (
        <div key={date}>
          {/* 날짜 헤더 */}
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            {formatDateHeader(date)}
          </h3>

          {/* 타임라인 노드 */}
          <div className="relative border-l-2 border-muted pl-6 space-y-4">
            {dayOrders.map((order) => {
              const status = order.status as OrderStatus;
              const primaryDate = getPrimaryDate(order);

              return (
                <div key={order.id} className="relative">
                  {/* 타임라인 도트 */}
                  <div className="absolute -left-[calc(1.5rem+5px)] top-2 w-3 h-3 rounded-full bg-primary" />

                  {/* 수주 카드 */}
                  <Card
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        {/* 수주번호 + 고객명 */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-muted-foreground">
                            {order.order_number}
                          </span>
                          <span className="font-semibold">
                            {order.customer?.name || '(고객 정보 없음)'}
                          </span>
                          <Badge className={ORDER_STATUS_COLORS[status]}>
                            {ORDER_STATUS_LABELS[status]}
                          </Badge>
                        </div>

                        {/* 유형 + 금액 */}
                        <div className="text-sm text-muted-foreground">
                          {order.closet_type || '(미정)'} ·{' '}
                          {order.confirmed_amount !== null
                            ? formatCurrency(order.confirmed_amount)
                            : order.quotation_amount
                              ? formatCurrency(order.quotation_amount)
                              : '(미정)'}
                          {primaryDate && ` · ${primaryDate}`}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
