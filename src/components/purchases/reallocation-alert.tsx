'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { ReallocationAlert } from '@/app/(dashboard)/purchases/receive-actions';

interface ReallocationAlertProps {
  alerts: ReallocationAlert[];
}

export function ReallocationAlert({ alerts }: ReallocationAlertProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border border-blue-300 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
      <h3 className="mb-3 text-sm font-semibold text-blue-900 dark:text-blue-300">
        재할당 알림
      </h3>
      <p className="mb-4 text-sm text-blue-800 dark:text-blue-400">
        입고된 품목이 부족한 주문에 사용될 수 있습니다:
      </p>
      <ul className="space-y-2">
        {alerts.map((alert, index) => (
          <li
            key={`${alert.order_id}-${alert.product_id}-${index}`}
            className="flex items-center justify-between rounded-md border border-blue-200 bg-white p-3 dark:border-blue-900 dark:bg-blue-950/50"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                주문: {alert.order_number}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {alert.product_name} - 부족 수량: {alert.shortage_quantity}
              </p>
            </div>
            <Link href={`/orders/${alert.order_id}`}>
              <Button variant="outline" size="sm">
                주문 보기
              </Button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
