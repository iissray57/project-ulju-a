'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { inventoryAdjustSchema, type InventoryAdjustData } from '@/lib/schemas/inventory';
import { adjustInventory } from '@/app/(dashboard)/inventory/actions';

interface AdjustInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  currentQuantity: number;
  heldQuantity: number;
  onSuccess?: () => void;
}

export function AdjustInventoryDialog({
  open,
  onOpenChange,
  productId,
  productName,
  currentQuantity,
  heldQuantity,
  onSuccess,
}: AdjustInventoryDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InventoryAdjustData>({
    resolver: zodResolver(inventoryAdjustSchema),
    defaultValues: {
      product_id: productId,
      quantity: currentQuantity,
      memo: '',
    },
  });

  const onSubmit = async (data: InventoryAdjustData) => {
    setIsSubmitting(true);

    try {
      const result = await adjustInventory(data);

      if (result.error) {
        toast.error('재고 조정 실패', {
          description: result.error,
        });
        return;
      }

      toast.success('재고 조정 완료', {
        description: `${productName} 재고가 ${data.quantity}개로 조정되었습니다`,
      });

      router.refresh();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('재고 조정 실패', {
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>재고 조정</DialogTitle>
          <DialogDescription>
            {productName}의 재고를 조정합니다
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 현재 재고 정보 표시 */}
            <div className="rounded-lg border p-3 space-y-2 bg-muted/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">현재 재고</span>
                <span className="font-medium">{currentQuantity}개</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">hold 수량</span>
                <span className="font-medium">{heldQuantity}개</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">가용 수량</span>
                <span className="font-medium">{currentQuantity - heldQuantity}개</span>
              </div>
            </div>

            {/* 새 수량 입력 */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>새 재고 수량 *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="새 재고 수량"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    hold 수량({heldQuantity}개) 이상이어야 합니다
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 메모 */}
            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>메모</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="조정 사유를 입력하세요 (선택)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '처리 중...' : '조정'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
