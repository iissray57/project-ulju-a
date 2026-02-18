'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getOrderCostSummary, type OrderCostSummary } from '@/app/(dashboard)/orders/actions';

interface OrderCostSummaryProps {
  orderId: string;
}

function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

export function OrderCostSummaryCard({ orderId }: OrderCostSummaryProps) {
  const [data, setData] = useState<OrderCostSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrderCostSummary(orderId).then((result) => {
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setData(result.data);
      }
      setLoading(false);
    });
  }, [orderId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">원가 / 마진</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <p className="text-sm text-muted-foreground">계산 중...</p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {data && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <dt className="text-muted-foreground">자재 원가</dt>
            <dd className="text-right font-medium">{formatKRW(data.materialCost)}</dd>

            <dt className="text-muted-foreground">외주 원가</dt>
            <dd className="text-right font-medium">{formatKRW(data.outsourceCost)}</dd>

            <dt className="text-muted-foreground font-semibold border-t pt-2">총 원가</dt>
            <dd className="text-right font-semibold border-t pt-2">{formatKRW(data.totalCost)}</dd>

            <dt className="text-muted-foreground">매출</dt>
            <dd className="text-right font-medium">{formatKRW(data.revenue)}</dd>

            <dt className="text-muted-foreground font-semibold">마진</dt>
            <dd
              className={`text-right font-semibold ${
                data.margin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatKRW(data.margin)}
            </dd>

            <dt className="text-muted-foreground font-semibold">마진율</dt>
            <dd
              className={`text-right font-semibold ${
                data.marginRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {data.marginRate.toFixed(1)}%
            </dd>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
