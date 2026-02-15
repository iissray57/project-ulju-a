import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getOrder } from '../actions';
import { OrderStatusBar } from '@/components/orders/order-status-bar';
import { OrderDetailSections } from '@/components/orders/order-detail-sections';
import { OrderSchedules } from '@/components/orders/order-schedules';
import { OrderMaterialsTable } from '@/components/orders/order-materials-table';
import { OrderChecklist } from '@/components/orders/order-checklist';
import { getOrderChecklist } from '../checklist-actions';
import { QuotationDownloadButton } from '@/components/orders/quotation-download-button';
import { LEGACY_STATUS_MAP, type OrderStatus } from '@/lib/schemas/order-status';

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

  const checklistResult = await getOrderChecklist(id);
  const checklists = checklistResult.success && checklistResult.data ? checklistResult.data : null;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/orders" className="text-muted-foreground hover:text-foreground">
                ← 뒤로
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold break-words">
            {order.order_number}
            {order.customer && (
              <span className="text-muted-foreground ml-2 sm:ml-3 text-xl sm:text-2xl">
                · {order.customer.name}
              </span>
            )}
          </h1>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <QuotationDownloadButton orderId={id} />
          <Button variant="outline" asChild className="flex-1 sm:flex-none">
            <Link href={`/orders/${id}/edit`}>수정</Link>
          </Button>
        </div>
      </div>

      <Separator />

      {/* 상태 바 */}
      <OrderStatusBar orderId={id} currentStatus={(LEGACY_STATUS_MAP[order.status || 'inquiry'] || 'inquiry') as OrderStatus} />

      <Separator />

      {/* 상세 정보 */}
      <OrderDetailSections order={order} />

      {/* 체크리스트 */}
      {checklists && (
        <OrderChecklist
          orderId={id}
          preparationItems={checklists.preparation}
          installationItems={checklists.installation}
        />
      )}

      {/* 자재 현황 */}
      <OrderMaterialsTable orderId={id} />

      {/* 관련 일정 */}
      <OrderSchedules orderId={id} />
    </div>
  );
}
