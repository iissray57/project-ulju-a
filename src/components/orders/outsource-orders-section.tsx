'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { formatPhone } from '@/lib/utils';
import {
  getOutsourceOrders,
  type OutsourceOrderWithSupplier,
  type OutsourceStatus,
} from '@/app/(dashboard)/orders/outsource-actions';
import { OutsourceOrderDialog } from './outsource-order-dialog';

const OUTSOURCE_TYPE_LABELS = { system: '시스템장', curtain: '커튼' };

const OUTSOURCE_STATUS_LABELS: Record<OutsourceStatus, string> = {
  requested: '의뢰',
  in_progress: '제작중',
  completed: '완료',
  cancelled: '취소',
};

function StatusBadge({ status }: { status: OutsourceStatus }) {
  const variants: Record<OutsourceStatus, string> = {
    requested:
      'bg-yellow-500/10 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
    in_progress:
      'bg-blue-500/10 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
    completed:
      'bg-green-500/10 text-green-700 dark:bg-green-950/30 dark:text-green-400',
    cancelled:
      'bg-red-500/10 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  };
  return (
    <Badge variant="secondary" className={variants[status]}>
      {OUTSOURCE_STATUS_LABELS[status]}
    </Badge>
  );
}

interface OutsourceOrdersSectionProps {
  orderId: string;
}

export function OutsourceOrdersSection({ orderId }: OutsourceOrdersSectionProps) {
  const [orders, setOrders] = useState<OutsourceOrderWithSupplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OutsourceOrderWithSupplier | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    const result = await getOutsourceOrders(orderId);
    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      setOrders(result.data);
    }
    setIsLoading(false);
  }, [orderId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRowClick = (order: OutsourceOrderWithSupplier) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedOrder(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedOrder(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>외주 발주</CardTitle>
          <Button size="sm" onClick={handleAddNew}>
            <Plus className="mr-1 h-4 w-4" />
            외주 발주 추가
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-muted-foreground text-sm text-center py-8">
              등록된 외주 발주가 없습니다
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>발주번호</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>거래처</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                    <TableHead className="text-center">상태</TableHead>
                    <TableHead>납기일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(order)}
                    >
                      <TableCell className="font-medium font-mono text-sm">
                        {order.outsource_number}
                      </TableCell>
                      <TableCell>
                        {OUTSOURCE_TYPE_LABELS[order.outsource_type as keyof typeof OUTSOURCE_TYPE_LABELS] ?? order.outsource_type}
                      </TableCell>
                      <TableCell>{order.supplier?.name ?? '-'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.supplier?.phone ? formatPhone(order.supplier.phone) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {order.amount != null
                          ? order.amount.toLocaleString('ko-KR') + '원'
                          : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={order.status as OutsourceStatus} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.due_date
                          ? new Date(order.due_date).toLocaleDateString('ko-KR')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <OutsourceOrderDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        orderId={orderId}
        outsourceOrder={selectedOrder}
        onSaved={loadOrders}
      />
    </>
  );
}
