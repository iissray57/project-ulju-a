'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { purchaseOrderFormSchema, type PurchaseOrderFormData } from '@/lib/schemas/purchase-order';
import { createPurchaseOrder, updatePurchaseOrder } from '@/app/(dashboard)/purchases/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';

interface PurchaseOrderFormProps {
  poId?: string;
  defaultValues?: PurchaseOrderFormData;
}

export function PurchaseOrderForm({ poId, defaultValues }: PurchaseOrderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderFormSchema),
    defaultValues: defaultValues
      ? {
          ...defaultValues,
          total_amount: defaultValues.total_amount ?? 0,
        }
      : {
          supplier_name: '',
          supplier_phone: '',
          total_amount: 0,
          payment_date: '',
          memo: '',
        },
  });

  const onSubmit = async (data: PurchaseOrderFormData) => {
    setIsSubmitting(true);

    try {
      const result = poId
        ? await updatePurchaseOrder(poId, data)
        : await createPurchaseOrder(data);

      if (result.error) {
        toast.error(result.error);
        setIsSubmitting(false);
        return;
      }

      toast.success(poId ? '발주 정보가 수정되었습니다' : '발주가 등록되었습니다');

      // Navigate to detail page or list
      if (result.data?.id) {
        router.push(`/purchases/${result.data.id}`);
      } else {
        router.push('/purchases');
      }
      router.refresh();
    } catch {
      toast.error('오류가 발생했습니다');
      setIsSubmitting(false);
    }
  };

  // Format number as Korean Won
  const formatCurrency = (value: string) => {
    const num = value.replace(/[^\d]/g, '');
    return num ? Number(num).toLocaleString('ko-KR') : '';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Supplier Information Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">거래처 정보</h2>
        <div className="space-y-2">
          <Label htmlFor="supplier_name">거래처명</Label>
          <Input
            id="supplier_name"
            {...register('supplier_name')}
            placeholder="거래처명을 입력하세요"
            aria-invalid={!!errors.supplier_name}
          />
          {errors.supplier_name && (
            <p className="text-sm text-destructive">{errors.supplier_name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="supplier_phone">연락처</Label>
          <Input
            id="supplier_phone"
            {...register('supplier_phone')}
            placeholder="연락처를 입력하세요"
            aria-invalid={!!errors.supplier_phone}
          />
          {errors.supplier_phone && (
            <p className="text-sm text-destructive">{errors.supplier_phone.message}</p>
          )}
        </div>
      </div>

      {/* Amount Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">금액</h2>
        <div className="space-y-2">
          <Label htmlFor="total_amount">
            합계 금액 (원) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="total_amount"
            type="text"
            {...register('total_amount', {
              setValueAs: (v) => (v === '' ? 0 : Number(v.replace(/[^\d]/g, ''))),
            })}
            onChange={(e) => {
              const formatted = formatCurrency(e.target.value);
              e.target.value = formatted;
            }}
            placeholder="0"
            aria-invalid={!!errors.total_amount}
          />
          {errors.total_amount && (
            <p className="text-sm text-destructive">{errors.total_amount.message}</p>
          )}
        </div>
      </div>

      {/* Payment Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">결제 정보</h2>
        <div className="space-y-2">
          <Label htmlFor="payment_date">결제 예정일</Label>
          <Input
            id="payment_date"
            type="date"
            {...register('payment_date')}
            aria-invalid={!!errors.payment_date}
          />
          {errors.payment_date && (
            <p className="text-sm text-destructive">{errors.payment_date.message}</p>
          )}
        </div>
      </div>

      {/* Memo Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">메모</h2>
        <div className="space-y-2">
          <Label htmlFor="memo">메모</Label>
          <Textarea
            id="memo"
            {...register('memo')}
            placeholder="메모를 입력하세요"
            rows={4}
            aria-invalid={!!errors.memo}
          />
          {errors.memo && <p className="text-sm text-destructive">{errors.memo.message}</p>}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? '처리 중...' : poId ? '수정' : '등록'}
        </Button>
      </div>
    </form>
  );
}
