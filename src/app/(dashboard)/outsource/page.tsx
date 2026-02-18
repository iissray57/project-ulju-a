import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getAllOutsourceOrders, type OutsourceStatus } from './actions';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const OUTSOURCE_STATUS_LABELS: Record<string, string> = {
  requested: '의뢰',
  in_progress: '제작중',
  completed: '완료',
  cancelled: '취소',
};

const OUTSOURCE_STATUS_COLORS: Record<string, string> = {
  requested: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const OUTSOURCE_TYPE_LABELS: Record<string, string> = {
  system: '시스템장',
  curtain: '커튼',
};

const STATUSES: OutsourceStatus[] = ['requested', 'in_progress', 'completed', 'cancelled'];

interface OutsourcePageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
  }>;
}

async function OutsourceContent({ searchParams }: OutsourcePageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const status = params.status as OutsourceStatus | undefined;
  const search = params.search;

  const result = await getAllOutsourceOrders({
    status,
    search,
    page: 1,
    limit: 100,
  });

  const orders = result.data ?? [];
  const total = result.count ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">외주 발주 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">총 {total}건</p>
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs defaultValue={status || 'all'} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all" asChild>
            <Link href="/outsource">전체</Link>
          </TabsTrigger>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} asChild>
              <Link href={`/outsource?status=${s}${search ? `&search=${encodeURIComponent(search)}` : ''}`}>
                {OUTSOURCE_STATUS_LABELS[s]}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search */}
      <form action="/outsource" method="get" className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          name="search"
          type="search"
          placeholder="발주번호, 거래처명, 주문번호로 검색..."
          defaultValue={search}
          className="pl-9"
        />
        {status && <input type="hidden" name="status" value={status} />}
      </form>

      {/* Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">발주번호</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">유형</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">거래처</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">주문번호</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">고객명</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">금액</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">상태</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">납기일</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">의뢰일</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                    외주 발주 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {order.order?.id ? (
                        <Link href={`/orders/${order.order.id}`} className="hover:underline">
                          {order.outsource_number}
                        </Link>
                      ) : (
                        order.outsource_number
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {OUTSOURCE_TYPE_LABELS[order.outsource_type] ?? order.outsource_type}
                    </td>
                    <td className="px-4 py-3">{order.supplier?.name ?? '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {order.order?.id ? (
                        <Link href={`/orders/${order.order.id}`} className="hover:underline">
                          {order.order.order_number}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3">{order.order?.customer?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {order.amount != null
                        ? `${order.amount.toLocaleString('ko-KR')}원`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        className={
                          OUTSOURCE_STATUS_COLORS[order.status] ??
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {OUTSOURCE_STATUS_LABELS[order.status] ?? order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order.due_date
                        ? new Date(order.due_date).toLocaleDateString('ko-KR')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order.requested_date
                        ? new Date(order.requested_date).toLocaleDateString('ko-KR')
                        : order.created_at
                          ? new Date(order.created_at).toLocaleDateString('ko-KR')
                          : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function OutsourcePage(props: OutsourcePageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground">로딩 중...</div>
        </div>
      }
    >
      <OutsourceContent {...props} />
    </Suspense>
  );
}
