'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_TRANSITIONS,
  type OrderStatus,
} from '@/lib/schemas/order-status';
import { transitionOrderStatus, type OrderWithCustomer } from '@/app/(dashboard)/orders/actions';
import { toast } from 'sonner';
import { StatusTransitionFormDialog } from './status-transition-form-dialog';

interface OrderStatusBarProps {
  order: OrderWithCustomer;
}

export function OrderStatusBar({ order }: OrderStatusBarProps) {
  const orderId = order.id;
  const currentStatus = order.status as OrderStatus;
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null);

  const availableTransitions = ORDER_TRANSITIONS[currentStatus];

  // cancelled 제외한 정상 프로세스 상태들
  const normalStatuses = ORDER_STATUS.filter((s) => s !== 'cancelled');
  const currentIndex = currentStatus === 'cancelled' ? -1 : normalStatuses.indexOf(currentStatus);

  const handleTransition = async (newStatus: OrderStatus) => {
    if (newStatus === 'cancelled') {
      setShowCancelDialog(true);
      return;
    }

    // 필수값 검증 다이얼로그 표시
    setTargetStatus(newStatus);
    setShowTransitionDialog(true);
  };

  const executeTransition = async (newStatus: OrderStatus) => {
    setIsTransitioning(true);
    try {
      const result = await transitionOrderStatus(orderId, newStatus);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`상태가 "${ORDER_STATUS_LABELS[newStatus]}"로 변경되었습니다.`);
        router.refresh();
      }
    } catch {
      toast.error('상태 전이 중 오류가 발생했습니다.');
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleCancel = async () => {
    setIsTransitioning(true);
    try {
      const result = await transitionOrderStatus(orderId, 'cancelled');
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('주문이 취소되었습니다.');
        setShowCancelDialog(false);
        router.refresh();
      }
    } catch {
      toast.error('주문 취소 중 오류가 발생했습니다.');
    } finally {
      setIsTransitioning(false);
    }
  };

  // 정방향 전이 (다음 상태)
  const forwardTransition = availableTransitions.forward.find((t) => {
    if (t === 'cancelled') return false;
    const targetIndex = normalStatuses.indexOf(t);
    return targetIndex > currentIndex;
  });

  // 역방향 전이 (이전 상태)
  const backwardTransition = availableTransitions.backward.find((t) => {
    if (t === 'cancelled') return false;
    const targetIndex = normalStatuses.indexOf(t);
    return targetIndex < currentIndex;
  });

  // 취소 가능 여부
  const canCancel = availableTransitions.forward.includes('cancelled');

  return (
    <div className="space-y-6">
      {/* 현재 상태 배지 */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">현재 상태:</span>
        <Badge className={ORDER_STATUS_COLORS[currentStatus]}>
          {ORDER_STATUS_LABELS[currentStatus]}
        </Badge>
      </div>

      {/* 프로그레스 인디케이터 */}
      {currentStatus !== 'cancelled' && (
        <div className="flex items-center gap-2 overflow-x-auto py-3">
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
                    {ORDER_STATUS_LABELS[status]}
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
      )}

      {/* 취소 상태 표시 */}
      {currentStatus === 'cancelled' && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <svg
            className="w-5 h-5 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span className="text-sm font-medium text-red-600 dark:text-red-400">
            이 주문는 취소되었습니다
          </span>
        </div>
      )}

      {/* 전이 버튼 */}
      {(availableTransitions.forward.length > 0 || availableTransitions.backward.length > 0) && (
        <div className="flex gap-3 flex-wrap">
          {forwardTransition && (
            <Button
              onClick={() => handleTransition(forwardTransition)}
              disabled={isTransitioning}
            >
              다음 단계: {ORDER_STATUS_LABELS[forwardTransition]}
            </Button>
          )}
          {backwardTransition && (
            <Button
              variant="outline"
              onClick={() => handleTransition(backwardTransition)}
              disabled={isTransitioning}
            >
              이전 단계: {ORDER_STATUS_LABELS[backwardTransition]}
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={() => setShowCancelDialog(true)}
              disabled={isTransitioning}
            >
              주문 취소
            </Button>
          )}
        </div>
      )}

      {/* 취소 확인 다이얼로그 */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>주문 취소</DialogTitle>
            <DialogDescription>
              정말 이 주문을 취소하시겠습니까? 취소 후에는 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">취소 사유 (선택)</Label>
            <Textarea
              id="reason"
              placeholder="취소 사유를 입력하세요..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isTransitioning}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isTransitioning}
            >
              {isTransitioning ? '처리 중...' : '주문 취소'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 상태 전이 필수값 입력 다이얼로그 */}
      {targetStatus && (
        <StatusTransitionFormDialog
          open={showTransitionDialog}
          onOpenChange={setShowTransitionDialog}
          order={order}
          fromStatus={currentStatus}
          toStatus={targetStatus}
        />
      )}

    </div>
  );
}
