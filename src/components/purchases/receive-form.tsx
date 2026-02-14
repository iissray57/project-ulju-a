'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { receivePurchaseOrder, type ReceiveItem } from '@/app/(dashboard)/purchases/receive-actions';

interface PurchaseOrderItem {
  id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  memo: string | null;
}

interface ReceiveFormProps {
  poId: string;
  items: PurchaseOrderItem[];
  onSuccess?: (receivedItems: ReceiveItem[]) => void;
}

export function ReceiveForm({ poId, items, onSuccess }: ReceiveFormProps) {
  const router = useRouter();
  const [receiveAll, setReceiveAll] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>(
    items.reduce(
      (acc, item) => {
        if (item.product_id) {
          acc[item.product_id] = item.quantity;
        }
        return acc;
      },
      {} as Record<string, number>
    )
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReceiveAllChange = (checked: boolean) => {
    setReceiveAll(checked);
    if (checked) {
      // 전체 입고 체크 시 모든 수량을 원래 수량으로 복원
      setQuantities(
        items.reduce(
          (acc, item) => {
            if (item.product_id) {
              acc[item.product_id] = item.quantity;
            }
            return acc;
          },
          {} as Record<string, number>
        )
      );
    }
  };

  const handleQuantityChange = (productId: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setQuantities((prev) => ({ ...prev, [productId]: numValue }));
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      let receiveItems: ReceiveItem[] | undefined;

      if (!receiveAll) {
        // 부분 입고: 입력된 수량 수집
        receiveItems = items
          .filter((item) => item.product_id && quantities[item.product_id] > 0)
          .map((item) => ({
            product_id: item.product_id!,
            quantity: quantities[item.product_id!],
          }));

        if (receiveItems.length === 0) {
          setError('입고 처리할 품목이 없습니다.');
          setIsSubmitting(false);
          return;
        }
      }

      // 입고 처리
      const result = await receivePurchaseOrder(poId, receiveItems);

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // 성공 시 콜백 또는 페이지 이동
      if (onSuccess && result.data) {
        onSuccess(result.data.received_items);
      } else {
        router.push(`/purchases/${poId}`);
      }
    } catch (err) {
      console.error('[ReceiveForm] Submit error:', err);
      setError('입고 처리 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* 전체 입고 옵션 */}
      <div className="flex items-center space-x-2 rounded-md border p-4">
        <Checkbox
          id="receive-all"
          checked={receiveAll}
          onCheckedChange={handleReceiveAllChange}
        />
        <Label htmlFor="receive-all" className="text-sm font-medium">
          전체 입고
        </Label>
      </div>

      {/* 품목별 입고 수량 */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">입고 품목</h3>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 품목이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    품목 ID: {item.product_id || '없음'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    발주 수량: {item.quantity}
                  </p>
                  {item.memo && (
                    <p className="text-xs text-muted-foreground">메모: {item.memo}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`qty-${item.id}`} className="text-xs">
                    입고 수량
                  </Label>
                  <Input
                    id={`qty-${item.id}`}
                    type="number"
                    min="0"
                    className="w-20"
                    value={quantities[item.product_id || ''] || 0}
                    onChange={(e) =>
                      item.product_id && handleQuantityChange(item.product_id, e.target.value)
                    }
                    disabled={receiveAll || !item.product_id}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 제출 버튼 */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          취소
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting || items.length === 0}>
          {isSubmitting ? '처리 중...' : '입고 처리'}
        </Button>
      </div>
    </div>
  );
}
