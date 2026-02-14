'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { OrderMaterialWithProduct } from '@/app/(dashboard)/orders/material-actions';

interface ShortageAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortageItems: OrderMaterialWithProduct[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function ShortageAlertDialog({
  open,
  onOpenChange,
  shortageItems,
  onConfirm,
  onCancel,
}: ShortageAlertDialogProps) {
  // 부족 품목 필터링 (shortage_quantity > 0)
  const shortages = shortageItems.filter((item) => item.shortage_quantity > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>자재 부족 경고</DialogTitle>
          <DialogDescription>
            다음 품목이 부족합니다. 그래도 다음 단계로 진행하시겠습니까?
          </DialogDescription>
        </DialogHeader>

        {/* 부족 품목 테이블 */}
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">제품명</th>
                <th className="px-4 py-3 text-right font-medium">필요량</th>
                <th className="px-4 py-3 text-right font-medium">가용량</th>
                <th className="px-4 py-3 text-right font-medium">부족분</th>
              </tr>
            </thead>
            <tbody>
              {shortages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    부족 품목 없음
                  </td>
                </tr>
              ) : (
                shortages.map((item) => (
                  <tr key={item.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3">
                      {item.product?.name ?? '(알 수 없음)'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {item.planned_quantity.toLocaleString()}
                      {item.product?.unit && (
                        <span className="ml-1 text-muted-foreground">
                          {item.product.unit}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {item.held_quantity.toLocaleString()}
                      {item.product?.unit && (
                        <span className="ml-1 text-muted-foreground">
                          {item.product.unit}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-red-600 dark:text-red-400 font-semibold">
                      {item.shortage_quantity.toLocaleString()}
                      {item.product?.unit && (
                        <span className="ml-1 text-muted-foreground">
                          {item.product.unit}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            그래도 진행
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
