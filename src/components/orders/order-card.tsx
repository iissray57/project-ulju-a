'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getStatusLabel,
  getStatusColor,
} from '@/lib/schemas/order-status';
import type { OrderWithCustomer } from '@/app/(dashboard)/orders/actions';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  });
}

interface OrderCardProps {
  order: OrderWithCustomer;
  /** When true, clicking navigates to detail. Default: true */
  clickable?: boolean;
  /** Compact mode for kanban cards. Default: false */
  compact?: boolean;
  className?: string;
}

export function OrderCard({
  order,
  clickable = true,
  compact = false,
  className,
}: OrderCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (clickable) {
      router.push(`/orders/${order.id}`);
    }
  };

  const amount = order.confirmed_amount ?? order.quotation_amount;

  return (
    <Card
      className={[
        'transition-shadow',
        clickable ? 'cursor-pointer hover:shadow-md' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
    >
      <CardContent className={compact ? 'p-3 space-y-1.5' : 'p-4 space-y-2'}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm truncate">
              {order.customer?.name || '고객 정보 없음'}
            </div>
            {!compact && (
              <div className="text-xs text-muted-foreground">
                {order.order_number}
              </div>
            )}
          </div>
          {order.status && !compact && (
            <Badge
              className={`${getStatusColor(order.status)} shrink-0 text-[10px] px-1.5 py-0.5`}
            >
              {getStatusLabel(order.status)}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground truncate">
            {order.work_type || '유형 미정'}
          </span>
          {amount ? (
            <span className="font-semibold shrink-0 ml-2">
              {formatCurrency(amount)}
            </span>
          ) : (
            <span className="text-muted-foreground shrink-0 ml-2">
              금액 미정
            </span>
          )}
        </div>

        {!compact && order.created_at && (
          <div className="text-[10px] text-muted-foreground">
            {formatDate(order.created_at)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
