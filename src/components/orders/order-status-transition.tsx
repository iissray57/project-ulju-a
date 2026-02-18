'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ORDER_TRANSITIONS,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from '@/lib/schemas/order-status';
import { ArrowRight, ArrowLeft, X } from 'lucide-react';
import { StatusTransitionFormDialog } from './status-transition-form-dialog';
import type { OrderWithCustomer } from '@/app/(dashboard)/orders/actions';

interface OrderStatusTransitionProps {
  order: OrderWithCustomer;
  onStatusChange?: () => void;
}

export function OrderStatusTransition({
  order,
  onStatusChange,
}: OrderStatusTransitionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);

  const currentStatus = order.status as OrderStatus;
  const transitions = ORDER_TRANSITIONS[currentStatus];
  const forwardOptions = transitions.forward;
  const backwardOptions = transitions.backward;

  const openDialog = (status: OrderStatus) => {
    setSelectedStatus(status);
    setIsDialogOpen(true);
  };

  // 최종 상태인 경우 전이 불가
  if (forwardOptions.length === 0 && backwardOptions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        최종 상태입니다. 더 이상 전이할 수 없습니다.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* 정방향 전이 */}
        {forwardOptions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">다음 단계로 진행</h4>
            <div className="flex flex-wrap gap-2">
              {forwardOptions.map((status) => (
                <Button
                  key={status}
                  variant={status === 'cancelled' ? 'destructive' : 'default'}
                  size="sm"
                  onClick={() => openDialog(status)}
                  className="gap-2"
                >
                  {ORDER_STATUS_LABELS[status]}
                  {status === 'cancelled' ? <X className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* 역방향 전이 */}
        {backwardOptions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">이전 단계로 되돌리기</h4>
            <div className="flex flex-wrap gap-2">
              {backwardOptions.map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  onClick={() => openDialog(status)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-3 w-3" />
                  {ORDER_STATUS_LABELS[status]}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 상태 전이 다이얼로그 (필수값 입력 포함) */}
      {selectedStatus && (
        <StatusTransitionFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          order={order}
          fromStatus={currentStatus}
          toStatus={selectedStatus}
          onSuccess={onStatusChange}
        />
      )}
    </>
  );
}
