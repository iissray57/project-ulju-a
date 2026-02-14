import { notFound } from 'next/navigation';
import { getPurchaseOrder } from '@/app/(dashboard)/purchases/actions';
import { ReceiveFormContainer } from './receive-form-container';

interface ReceivePageProps {
  params: Promise<{ id: string }>;
}

export default async function ReceivePage({ params }: ReceivePageProps) {
  const { id } = await params;

  // 발주 조회
  const result = await getPurchaseOrder(id);

  if (result.error || !result.data) {
    notFound();
  }

  const { data: purchaseOrder } = result;

  // ordered 상태에서만 입고 처리 가능
  if (purchaseOrder.status !== 'ordered') {
    return (
      <div className="container mx-auto max-w-3xl p-6">
        <div className="rounded-md border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
          <h2 className="text-lg font-semibold text-red-900 dark:text-red-300">
            입고 처리 불가
          </h2>
          <p className="mt-2 text-sm text-red-800 dark:text-red-400">
            주문(ordered) 상태에서만 입고 처리가 가능합니다.
          </p>
          <p className="mt-1 text-sm text-red-800 dark:text-red-400">
            현재 상태: {purchaseOrder.status}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">입고 처리</h1>

      {/* 발주 정보 */}
      <div className="mb-6 rounded-md border p-4">
        <h2 className="mb-3 text-lg font-semibold">발주 정보</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="font-medium text-muted-foreground">발주번호</dt>
            <dd className="mt-1">{purchaseOrder.po_number}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">공급업체</dt>
            <dd className="mt-1">{purchaseOrder.supplier_name || '-'}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">총 금액</dt>
            <dd className="mt-1">{(purchaseOrder.total_amount ?? 0).toLocaleString()}원</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">결제 예정일</dt>
            <dd className="mt-1">
              {purchaseOrder.payment_date
                ? new Date(purchaseOrder.payment_date).toLocaleDateString('ko-KR')
                : '-'}
            </dd>
          </div>
        </dl>
        {purchaseOrder.memo && (
          <div className="mt-3">
            <dt className="text-sm font-medium text-muted-foreground">메모</dt>
            <dd className="mt-1 text-sm">{purchaseOrder.memo}</dd>
          </div>
        )}
      </div>

      {/* 입고 폼 */}
      <ReceiveFormContainer poId={id} items={purchaseOrder.items || []} />
    </div>
  );
}
