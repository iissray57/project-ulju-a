import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OrderList } from '@/components/orders/order-list';
import { getOrders } from './actions';
import type { Database } from '@/lib/database.types';

type OrderStatus = Database['public']['Enums']['order_status'];

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status as OrderStatus | undefined;
  const search = params.q || '';
  const page = Number(params.page || '1');
  const limit = 20;

  const result = await getOrders({ status, search, page, limit });

  if (result.error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">수주 관리</h1>
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
          <h1 className="text-3xl font-bold">수주 관리</h1>
          <p className="text-muted-foreground mt-2">
            총 {total}건의 수주가 등록되어 있습니다
          </p>
        </div>
        <Button asChild className="hidden md:flex">
          <Link href="/orders/new">수주 등록</Link>
        </Button>
      </div>

      <OrderList orders={orders} total={total} />
    </div>
  );
}
