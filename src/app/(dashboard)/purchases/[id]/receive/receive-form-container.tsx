'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReceiveForm } from '@/components/purchases/receive-form';
import { ReallocationAlert } from '@/components/purchases/reallocation-alert';
import { getReallocationAlerts, type ReallocationAlert as Alert, type ReceiveItem } from '@/app/(dashboard)/purchases/receive-actions';

interface PurchaseOrderItem {
  id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  memo: string | null;
}

interface ReceiveFormContainerProps {
  poId: string;
  items: PurchaseOrderItem[];
}

export function ReceiveFormContainer({ poId, items }: ReceiveFormContainerProps) {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);

  const handleSuccess = async (receivedItems: ReceiveItem[]) => {
    // 입고 완료 후 재할당 알림 조회
    const productIds = receivedItems.map((item) => item.product_id);

    if (productIds.length > 0) {
      const result = await getReallocationAlerts(productIds);

      if (!result.error && result.data) {
        setAlerts(result.data);
        setShowAlerts(true);
      }
    }

    // 알림이 없으면 바로 이동
    if (!showAlerts) {
      router.push(`/purchases/${poId}`);
    }
  };

  if (showAlerts) {
    return (
      <div className="space-y-6">
        <ReallocationAlert alerts={alerts} />
        <div className="flex justify-end">
          <button
            onClick={() => router.push(`/purchases/${poId}`)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            발주 상세로 이동
          </button>
        </div>
      </div>
    );
  }

  return <ReceiveForm poId={poId} items={items} onSuccess={handleSuccess} />;
}
