import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  type OrderStatus,
} from '@/lib/schemas/order-status';

interface StatusCount {
  status: OrderStatus;
  count: number;
}

export async function OrderPipelineSummary() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const statusCounts: StatusCount[] = [];
  let totalCount = 0;

  if (user) {
    // 각 상태별 건수 조회
    for (const status of ORDER_STATUS) {
      if (status === 'cancelled') continue; // 취소 건은 제외

      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', status);

      if (!error && count !== null) {
        statusCounts.push({ status, count });
        totalCount += count;
      }
    }
  }

  const activeStatusCounts = statusCounts.filter((item) => item.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          수주 파이프라인
        </CardTitle>
        <CardAction>
          <Link
            href="/orders"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            더 보기
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {activeStatusCounts.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">진행 중인 수주가 없습니다</p>
        )}
        {activeStatusCounts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="text-sm font-semibold">전체</span>
              <span className="text-lg font-bold">{totalCount}</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {activeStatusCounts.map(({ status, count }) => (
                <Link
                  key={status}
                  href={`/orders?status=${status}`}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent transition-colors"
                >
                  <Badge variant="outline" className={ORDER_STATUS_COLORS[status]}>
                    {ORDER_STATUS_LABELS[status]}
                  </Badge>
                  <span className="text-sm font-semibold">{count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
