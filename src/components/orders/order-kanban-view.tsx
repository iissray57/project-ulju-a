'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropProvider } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { useDroppable } from '@dnd-kit/react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { OrderCard } from './order-card';
import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  canTransition,
  type OrderStatus,
} from '@/lib/schemas/order-status';
import { transitionOrderStatus } from '@/app/(dashboard)/orders/actions';
import type { OrderWithCustomer } from '@/app/(dashboard)/orders/actions';

/** Main pipeline statuses shown as columns */
const PIPELINE_STATUSES: OrderStatus[] = [
  'inquiry',
  'quotation_sent',
  'confirmed',
  'measurement_done',
  'date_fixed',
  'material_held',
  'installed',
];

/** Terminal/archive statuses shown collapsed */
const ARCHIVE_STATUSES: OrderStatus[] = [
  'settlement_wait',
  'revenue_confirmed',
  'cancelled',
];

// Color mapping for column header dots
const STATUS_DOT_COLORS: Record<OrderStatus, string> = {
  inquiry: 'bg-purple-500',
  quotation_sent: 'bg-blue-500',
  confirmed: 'bg-green-500',
  measurement_done: 'bg-teal-500',
  date_fixed: 'bg-cyan-500',
  material_held: 'bg-orange-500',
  installed: 'bg-emerald-500',
  settlement_wait: 'bg-yellow-500',
  revenue_confirmed: 'bg-stone-500',
  cancelled: 'bg-red-500',
};

interface OrderKanbanViewProps {
  orders: OrderWithCustomer[];
}

/** Draggable kanban card wrapper */
function KanbanCard({
  order,
  columnStatus,
  index,
}: {
  order: OrderWithCustomer;
  columnStatus: OrderStatus;
  index: number;
}) {
  const { ref, isDragging } = useSortable({
    id: order.id,
    group: columnStatus,
    index,
    data: { orderId: order.id, currentStatus: columnStatus },
  });

  return (
    <div
      ref={ref}
      style={{
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none',
      }}
    >
      <OrderCard order={order} compact clickable={!isDragging} />
    </div>
  );
}

/** Droppable column */
function KanbanColumn({
  status,
  orders,
}: {
  status: OrderStatus;
  orders: OrderWithCustomer[];
}) {
  const { ref, isDropTarget } = useDroppable({
    id: `column-${status}`,
    data: { status },
    accept: 'sortable',
  });

  return (
    <div className="flex flex-col min-w-[260px] max-w-[300px] shrink-0">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2 mb-2">
        <div
          className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT_COLORS[status]}`}
        />
        <span className="font-semibold text-sm">
          {ORDER_STATUS_LABELS[status]}
        </span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
          {orders.length}
        </Badge>
      </div>

      {/* Cards container */}
      <div
        ref={ref}
        className={[
          'flex-1 space-y-2 p-2 rounded-lg min-h-[120px] transition-colors',
          isDropTarget
            ? 'bg-accent/60 ring-2 ring-primary/30'
            : 'bg-muted/40',
        ].join(' ')}
      >
        {orders.map((order, index) => (
          <KanbanCard
            key={order.id}
            order={order}
            columnStatus={status}
            index={index}
          />
        ))}

        {orders.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
            수주 없음
          </div>
        )}
      </div>
    </div>
  );
}

/** Archive section for completed/cancelled orders */
function ArchiveSection({
  status,
  orders,
}: {
  status: OrderStatus;
  orders: OrderWithCustomer[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (orders.length === 0) return null;

  return (
    <div className="border rounded-lg p-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <div
          className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[status]}`}
        />
        <span className="text-sm font-medium">
          {ORDER_STATUS_LABELS[status]}
        </span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
          {orders.length}
        </Badge>
        <span className="ml-auto text-xs text-muted-foreground">
          {expanded ? '접기' : '펼치기'}
        </span>
      </button>

      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} compact />
          ))}
        </div>
      )}
    </div>
  );
}

export function OrderKanbanView({ orders }: OrderKanbanViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Group orders by status
  const ordersByStatus = useCallback(() => {
    const grouped: Record<OrderStatus, OrderWithCustomer[]> = {} as Record<
      OrderStatus,
      OrderWithCustomer[]
    >;
    for (const s of ORDER_STATUS) {
      grouped[s] = [];
    }
    for (const order of orders) {
      const status = order.status as OrderStatus;
      if (status && grouped[status]) {
        grouped[status].push(order);
      }
    }
    return grouped;
  }, [orders])();

  const handleDragEnd = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: any) => {
      const { operation, canceled } = event;

      if (canceled) return;

      const source = operation.source;
      const target = operation.target;

      if (!source || !target) return;

      const sourceData = source.data as
        | { orderId: string; currentStatus: OrderStatus }
        | undefined;
      const targetData = target.data as
        | { status: OrderStatus }
        | undefined;

      if (!sourceData) return;

      // Determine the target status
      // target could be a column droppable or another sortable card
      let targetStatus: OrderStatus | undefined;

      if (targetData && 'status' in targetData) {
        // Dropped on a column
        targetStatus = targetData.status;
      } else if (targetData && 'currentStatus' in targetData) {
        // Dropped on another card in a different column
        targetStatus = (targetData as { currentStatus: OrderStatus })
          .currentStatus;
      }

      if (!targetStatus) return;

      const fromStatus = sourceData.currentStatus;
      const orderId = sourceData.orderId;

      // Same column: no action needed
      if (fromStatus === targetStatus) return;

      // Validate transition
      if (!canTransition(fromStatus, targetStatus)) {
        const fromLabel = ORDER_STATUS_LABELS[fromStatus];
        const toLabel = ORDER_STATUS_LABELS[targetStatus];
        toast.error(`${fromLabel}에서 ${toLabel}(으)로 이동할 수 없습니다`, {
          description: '인접한 상태로만 이동할 수 있습니다.',
        });
        return;
      }

      // Execute transition
      startTransition(async () => {
        const result = await transitionOrderStatus(orderId, targetStatus);
        if (result.error) {
          toast.error('상태 변경 실패', { description: result.error });
        } else {
          const toLabel = ORDER_STATUS_LABELS[targetStatus];
          toast.success(`${toLabel} 상태로 변경되었습니다`);
          router.refresh();
        }
      });
    },
    [router]
  );

  return (
    <div className="space-y-4">
      {isPending && (
        <div className="text-xs text-muted-foreground text-center py-1">
          상태 변경 중...
        </div>
      )}

      {/* Main pipeline - horizontal scroll */}
      <div className="overflow-x-auto pb-4 -mx-2 px-2">
        <DragDropProvider onDragEnd={handleDragEnd}>
          <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
            {PIPELINE_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                orders={ordersByStatus[status]}
              />
            ))}
          </div>
        </DragDropProvider>
      </div>

      {/* Archive sections */}
      {ARCHIVE_STATUSES.some((s) => ordersByStatus[s].length > 0) && (
        <div className="space-y-2 pt-2 border-t">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            완료/취소
          </h3>
          {ARCHIVE_STATUSES.map((status) => (
            <ArchiveSection
              key={status}
              status={status}
              orders={ordersByStatus[status]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
