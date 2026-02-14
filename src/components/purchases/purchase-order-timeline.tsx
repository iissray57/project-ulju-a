'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PO_STATUS_LABELS,
  PO_STATUS_COLORS,
  type PoStatus,
} from '@/lib/schemas/purchase-order';
import type { Database } from '@/lib/database.types';

type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row'];

interface PurchaseOrderTimelineProps {
  orders: PurchaseOrder[];
}

// 날짜별 그룹화 (최신순)
function groupByDate(orders: PurchaseOrder[]): Map<string, PurchaseOrder[]> {
  const grouped = new Map<string, PurchaseOrder[]>();

  for (const order of orders) {
    if (!order.created_at) continue;
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

export function PurchaseOrderTimeline({ orders }: PurchaseOrderTimelineProps) {
  const router = useRouter();
  const grouped = groupByDate(orders);

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        표시할 발주가 없습니다
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
              const status = order.status as PoStatus;

              return (
                <div key={order.id} className="relative">
                  {/* 타임라인 도트 */}
                  <div className="absolute -left-[calc(1.5rem+5px)] top-2 w-3 h-3 rounded-full bg-primary" />

                  {/* 발주 카드 */}
                  <Card
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push(`/purchases/${order.id}`)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        {/* 발주번호 + 거래처명 */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-mono text-muted-foreground">
                            {order.po_number}
                          </span>
                          <span className="font-semibold">
                            {order.supplier_name || '(거래처 미정)'}
                          </span>
                          <Badge className={PO_STATUS_COLORS[status]}>
                            {PO_STATUS_LABELS[status]}
                          </Badge>
                        </div>

                        {/* 금액 + 결제일 */}
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(order.total_amount ?? 0)}
                          {order.payment_date && ` · 결제일: ${new Date(order.payment_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`}
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
