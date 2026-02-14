import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getPurchaseOrder } from '../actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PurchaseOrderStatusBar } from '@/components/purchases/purchase-order-status-bar';
import { PurchaseOrderItems } from '@/components/purchases/purchase-order-items';
import { PO_STATUS_LABELS, type PoStatus } from '@/lib/schemas/purchase-order';

interface PurchaseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PurchaseDetailPage({ params }: PurchaseDetailPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const result = await getPurchaseOrder(id);

  if (result.error || !result.data) {
    notFound();
  }

  const po = result.data;
  const status = po.status as PoStatus;

  // 금액 포맷
  const formatCurrency = (value: number) => {
    return `₩${(value / 10000).toFixed(0)}만`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{po.po_number}</h1>
          <p className="text-muted-foreground mt-2">
            {PO_STATUS_LABELS[status]} · {po.created_at && new Date(po.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/purchases/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              수정
            </Link>
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <Card>
        <CardHeader>
          <CardTitle>상태 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseOrderStatusBar orderId={id} currentStatus={status} />
        </CardContent>
      </Card>

      {/* Purchase Order Info */}
      <Card>
        <CardHeader>
          <CardTitle>발주 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">거래처명</div>
              <div className="font-medium">{po.supplier_name || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">연락처</div>
              <div className="font-medium">{po.supplier_phone || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">합계 금액</div>
              <div className="font-medium text-lg">{formatCurrency(po.total_amount ?? 0)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">결제 예정일</div>
              <div className="font-medium">
                {po.payment_date ? new Date(po.payment_date).toLocaleDateString('ko-KR') : '-'}
              </div>
            </div>
          </div>
          {po.memo && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">메모</div>
              <div className="text-sm whitespace-pre-wrap p-3 bg-muted rounded-md">
                {po.memo}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardContent className="pt-6">
          <PurchaseOrderItems poId={id} items={po.items} />
        </CardContent>
      </Card>
    </div>
  );
}
