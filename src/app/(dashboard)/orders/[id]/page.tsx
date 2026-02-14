import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getOrder } from '../actions';
import { OrderStatusBar } from '@/components/orders/order-status-bar';
import { OrderDetailSections } from '@/components/orders/order-detail-sections';
import { OrderSchedules } from '@/components/orders/order-schedules';
import { OrderMaterialsTable } from '@/components/orders/order-materials-table';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getOrder(id);

  if (result.error || !result.data) {
    notFound();
  }

  const order = result.data;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/orders" className="text-muted-foreground hover:text-foreground">
                ← 뒤로
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">
            {order.order_number}
            {order.customer && (
              <span className="text-muted-foreground ml-3 text-2xl">
                · {order.customer.name}
              </span>
            )}
          </h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href={`/orders/${id}/edit`}>수정</Link>
          </Button>
        </div>
      </div>

      <Separator />

      {/* 상태 바 */}
      <OrderStatusBar orderId={id} currentStatus={order.status || 'inquiry'} />

      <Separator />

      {/* 상세 정보 */}
      <OrderDetailSections order={order} />

      {/* 자재 현황 */}
      <OrderMaterialsTable orderId={id} />

      {/* 관련 일정 */}
      <OrderSchedules orderId={id} />
    </div>
  );
}
