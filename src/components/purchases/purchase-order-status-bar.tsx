'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PO_STATUS,
  PO_STATUS_LABELS,
  PO_STATUS_COLORS,
  PO_TRANSITIONS,
  type PoStatus,
} from '@/lib/schemas/purchase-order';
import { transitionPurchaseOrderStatus } from '@/app/(dashboard)/purchases/actions';
import { toast } from 'sonner';

interface PurchaseOrderStatusBarProps {
  orderId: string;
  currentStatus: PoStatus;
}

export function PurchaseOrderStatusBar({
  orderId,
  currentStatus,
}: PurchaseOrderStatusBarProps) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const availableTransitions = PO_TRANSITIONS[currentStatus];

  // 정상 프로세스 상태들 (cost_confirmed는 최종 상태)
  const normalStatuses = PO_STATUS;
  const currentIndex = normalStatuses.indexOf(currentStatus);

  const handleTransition = async (newStatus: PoStatus) => {
    setIsTransitioning(true);
    try {
      const result = await transitionPurchaseOrderStatus(orderId, newStatus);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`상태가 "${PO_STATUS_LABELS[newStatus]}"로 변경되었습니다.`);
        router.refresh();
      }
    } catch {
      toast.error('상태 전이 중 오류가 발생했습니다.');
    } finally {
      setIsTransitioning(false);
    }
  };

  // 정방향 전이 (다음 상태)
  const forwardTransition = availableTransitions.find((t) => {
    const targetIndex = normalStatuses.indexOf(t);
    return targetIndex > currentIndex;
  });

  // 역방향 전이 (이전 상태)
  const backwardTransition = availableTransitions.find((t) => {
    const targetIndex = normalStatuses.indexOf(t);
    return targetIndex < currentIndex;
  });

  return (
    <div className="space-y-6">
      {/* 현재 상태 배지 */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">현재 상태:</span>
        <Badge className={PO_STATUS_COLORS[currentStatus]}>
          {PO_STATUS_LABELS[currentStatus]}
        </Badge>
      </div>

      {/* 프로그레스 인디케이터 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {normalStatuses.map((status, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={status} className="flex items-center gap-2 shrink-0">
              {/* 상태 원 */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isPast
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isCurrent
                        ? 'bg-primary/20 border-primary ring-2 ring-primary ring-offset-2'
                        : 'bg-muted border-muted-foreground/30'
                  }`}
                >
                  {isPast && (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-xs whitespace-nowrap ${
                    isCurrent ? 'font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  {PO_STATUS_LABELS[status]}
                </span>
              </div>

              {/* 연결선 */}
              {index < normalStatuses.length - 1 && (
                <div
                  className={`w-8 h-0.5 ${
                    isPast ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 전이 버튼 */}
      {availableTransitions.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {forwardTransition && (
            <Button
              onClick={() => handleTransition(forwardTransition)}
              disabled={isTransitioning}
            >
              다음 단계: {PO_STATUS_LABELS[forwardTransition]}
            </Button>
          )}
          {backwardTransition && (
            <Button
              variant="outline"
              onClick={() => handleTransition(backwardTransition)}
              disabled={isTransitioning}
            >
              이전 단계: {PO_STATUS_LABELS[backwardTransition]}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
