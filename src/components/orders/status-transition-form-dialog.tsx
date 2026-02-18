'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from '@/lib/schemas/order-status';
import { WORK_TYPE_LABELS, type WorkType } from '@/lib/schemas/order';
import { transitionOrderStatus, updateOrder } from '@/app/(dashboard)/orders/actions';
import type { OrderWithCustomer } from '@/app/(dashboard)/orders/actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// 상태 전이별 필수 필드 정의
type RequiredField = {
  key: keyof OrderWithCustomer;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: { value: string; label: string }[];
};

const TRANSITION_REQUIRED_FIELDS: Record<string, RequiredField[]> = {
  // inquiry → quotation_sent: 견적액 필수
  'inquiry→quotation_sent': [
    { key: 'quotation_amount', label: '견적액', type: 'number' },
  ],
  // quotation_sent → confirmed: 확정액, 작업유형 필수
  'quotation_sent→confirmed': [
    { key: 'confirmed_amount', label: '확정액', type: 'number' },
    {
      key: 'work_type',
      label: '작업 유형',
      type: 'select',
      options: Object.entries(WORK_TYPE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    },
  ],
  // confirmed → measurement_done: 실측일, 현장주소 필수
  'confirmed→measurement_done': [
    { key: 'measurement_date', label: '실측일', type: 'date' },
    { key: 'site_address', label: '현장 주소', type: 'text' },
  ],
  // measurement_done → date_fixed: 설치일 필수
  'measurement_done→date_fixed': [
    { key: 'installation_date', label: '설치일', type: 'date' },
  ],
};

interface StatusTransitionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithCustomer;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  onSuccess?: () => void;
}

export function StatusTransitionFormDialog({
  open,
  onOpenChange,
  order,
  fromStatus,
  toStatus,
  onSuccess,
}: StatusTransitionFormDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [error, setError] = useState<string | null>(null);

  const transitionKey = `${fromStatus}→${toStatus}`;
  const requiredFields = TRANSITION_REQUIRED_FIELDS[transitionKey] || [];

  // 누락된 필드만 필터링
  const missingFields = requiredFields.filter((field) => {
    const value = order[field.key];
    if (value === null || value === undefined || value === '') return true;
    if (field.type === 'number' && (value as number) <= 0) return true;
    return false;
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 누락된 필드가 있으면 먼저 업데이트
      if (missingFields.length > 0) {
        // formData 검증
        for (const field of missingFields) {
          const value = formData[field.key];
          if (value === undefined || value === '' || (field.type === 'number' && Number(value) <= 0)) {
            setError(`${field.label}을(를) 입력해주세요.`);
            setIsLoading(false);
            return;
          }
        }

        // 주문 정보 업데이트
        const updateData: Record<string, unknown> = {};
        for (const field of missingFields) {
          const value = formData[field.key];
          if (field.type === 'number') {
            updateData[field.key] = Number(value);
          } else {
            updateData[field.key] = value;
          }
        }

        const updateResult = await updateOrder(order.id, updateData);
        if (updateResult.error) {
          setError(updateResult.error);
          setIsLoading(false);
          return;
        }
      }

      // 상태 전이 실행
      const result = await transitionOrderStatus(order.id, toStatus);
      if (result.error) {
        setError(result.error);
      } else {
        toast.success(`${ORDER_STATUS_LABELS[toStatus]}(으)로 전환되었습니다.`);
        onOpenChange(false);
        onSuccess?.();
        router.refresh();
      }
    } catch (err) {
      setError('처리 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 이미 모든 필수 필드가 입력되어 있는 경우 바로 전이
  const hasAllRequiredFields = missingFields.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>상태 전이 확인</DialogTitle>
          <DialogDescription>
            <span className="font-medium">{ORDER_STATUS_LABELS[fromStatus]}</span>
            {' → '}
            <span className="font-medium">{ORDER_STATUS_LABELS[toStatus]}</span>
          </DialogDescription>
        </DialogHeader>

        {/* 필수 필드 입력 폼 */}
        {missingFields.length > 0 && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              다음 항목을 입력해야 진행할 수 있습니다:
            </p>
            {missingFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label} <span className="text-destructive">*</span>
                </Label>
                {field.type === 'select' ? (
                  <Select
                    value={formData[field.key]?.toString() || ''}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, [field.key]: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`${field.label} 선택`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.key}
                    type={field.type === 'number' ? 'number' : field.type}
                    placeholder={field.label}
                    value={formData[field.key] || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    min={field.type === 'number' ? 0 : undefined}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {hasAllRequiredFields && (
          <p className="text-sm text-muted-foreground py-2">
            상태를 변경하시겠습니까?
          </p>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            variant={toStatus === 'cancelled' ? 'destructive' : 'default'}
          >
            {isLoading ? '처리 중...' : '확인'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
