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

interface PurchaseOrderListProps {
  orders: PurchaseOrder[];
  total: number;
}

// 금액 포맷: "₩350만"
function formatCurrency(amount: number): string {
  const manWon = amount / 10000;
  return `₩${manWon.toFixed(0)}만`;
}

export function PurchaseOrderList({ orders, total }: PurchaseOrderListProps) {
  const router = useRouter();

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        표시할 발주가 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        총 {total}건
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const status = order.status as PoStatus;

          return (
            <Card
              key={order.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/purchases/${order.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  {/* 발주번호 + 거래처 */}
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

                  {/* 금액 + 일자 */}
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(order.total_amount ?? 0)}
                    {order.payment_date && ` · 결제일: ${new Date(order.payment_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`}
                  </div>
                </div>

                {/* 생성일 (우측) */}
                <div className="text-xs text-muted-foreground shrink-0">
                  {order.created_at && new Date(order.created_at).toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric' })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
