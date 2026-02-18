import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OrdersViewContainer } from '@/components/orders/orders-view-container';
import { getOrders } from './actions';
import type { Database } from '@/lib/database.types';

type OrderStatus = Database['public']['Enums']['order_status'];

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; page?: string; year?: string; month?: string }>;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status as OrderStatus | undefined;
  const search = params.q || '';
  const page = Number(params.page || '1');
  const limit = 200; // Kanban needs all orders; pagination handled in list view

  // 월별 필터 (기본값: 현재 월)
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month ? Number(params.month) : now.getMonth() + 1;

  const result = await getOrders({ status, search, year, month, page, limit });

  if (result.error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">주문 관리</h1>
        </div>
        <div className="text-center py-12 text-destructive">{result.error}</div>
      </div>
    );
  }

  const orders = result.data || [];
  const total = result.count || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">주문 관리</h1>
          <p className="text-muted-foreground mt-2">
            {year}년 {month}월: 총 {total}건
          </p>
        </div>
        <Button asChild className="hidden md:flex">
          <Link href="/orders/new">주문 등록</Link>
        </Button>
      </div>

      <OrdersViewContainer orders={orders} total={total} year={year} month={month} />
    </div>
  );
}
