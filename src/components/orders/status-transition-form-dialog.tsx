'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
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
import { transitionOrderStatus, updateOrder, getOrderReadiness, getOutsourceOrderSummary } from '@/app/(dashboard)/orders/actions';
import type { OrderWithCustomer } from '@/app/(dashboard)/orders/actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { PAYMENT_METHOD_LABELS } from '@/lib/schemas/order';

// 상태 전이별 필드 정의
type TransitionField = {
  key: keyof OrderWithCustomer;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
  required?: boolean; // default: true
};

const TRANSITION_FIELDS: Record<string, TransitionField[]> = {
  // inquiry → quotation: 견적액 필수
  'inquiry→quotation': [
    { key: 'quotation_amount', label: '견적액', type: 'number' },
  ],
  // quotation → work: 확정액, 설치일 필수
  'quotation→work': [
    { key: 'confirmed_amount', label: '확정액', type: 'number' },
    { key: 'installation_date', label: '설치일', type: 'date' },
  ],
  // work → settlement_wait: 결제수단 필수, 정산메모 선택
  'work→settlement_wait': [
    {
      key: 'payment_method',
      label: '결제 수단',
      type: 'select',
      options: Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    },
    { key: 'settlement_memo', label: '정산 메모', type: 'textarea', required: false },
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
  const [readiness, setReadiness] = useState<{
    hasModels: boolean;
    hasMaterials: boolean;
    modelCount: number;
    materialCount: number;
  } | null>(null);
  const [readinessLoaded, setReadinessLoaded] = useState(false);
  const [outsourceSummary, setOutsourceSummary] = useState<{
    total: number;
    completed: number;
    incomplete: number;
  } | null>(null);
  const [outsourceSummaryLoaded, setOutsourceSummaryLoaded] = useState(false);

  const isQuotationTransition = fromStatus === 'inquiry' && toStatus === 'quotation';
  const isSettlementWaitTransition = fromStatus === 'work' && toStatus === 'settlement_wait';

  // inquiry→quotation 전이 시 모델/자재 등록 여부 사전 조회
  useEffect(() => {
    if (open && isQuotationTransition) {
      setReadinessLoaded(false);
      getOrderReadiness(order.id).then((result) => {
        setReadiness(result);
        setReadinessLoaded(true);
      });
    }
  }, [open, isQuotationTransition, order.id]);

  // work→settlement_wait 전이 시 외주 완료 현황 사전 조회
  useEffect(() => {
    if (open && isSettlementWaitTransition) {
      setOutsourceSummaryLoaded(false);
      getOutsourceOrderSummary(order.id).then((result) => {
        setOutsourceSummary(result);
        setOutsourceSummaryLoaded(true);
      });
    }
  }, [open, isSettlementWaitTransition, order.id]);

  const transitionKey = `${fromStatus}→${toStatus}`;
  const transitionFields = TRANSITION_FIELDS[transitionKey] || [];

  // 값이 비어있는 필드 필터링 (항상 표시 대상)
  const missingFields = transitionFields.filter((field) => {
    const value = order[field.key];
    if (value === null || value === undefined || value === '') return true;
    if (field.type === 'number' && (value as number) <= 0) return true;
    return false;
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // inquiry→quotation: 모델/자재 등록 여부 검증
      if (isQuotationTransition && readiness) {
        const missing: string[] = [];
        if (!readiness.hasModels) missing.push('모델');
        if (!readiness.hasMaterials) missing.push('자재');
        if (missing.length > 0) {
          setError(`${missing.join(', ')}이(가) 등록되지 않았습니다. 견적 전환 전에 먼저 등록해주세요.`);
          setIsLoading(false);
          return;
        }
      }

      // 누락된 필드가 있으면 먼저 업데이트
      if (missingFields.length > 0) {
        // 필수 필드만 검증 (required !== false)
        for (const field of missingFields) {
          if (field.required === false) continue;
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

        {/* work→settlement_wait: 외주 발주 완료 현황 */}
        {isSettlementWaitTransition && (
          <div className="space-y-2 py-2">
            <p className="text-sm font-medium">외주 발주 현황</p>
            {!outsourceSummaryLoaded ? (
              <p className="text-sm text-muted-foreground">확인 중...</p>
            ) : outsourceSummary ? (
              outsourceSummary.total === 0 ? (
                <p className="text-sm text-muted-foreground">외주 발주 없음 (앵글 전용 주문)</p>
              ) : (
                <div className="space-y-1 text-sm">
                  <div className={`flex items-center gap-2 ${outsourceSummary.incomplete === 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                    <span>{outsourceSummary.incomplete === 0 ? '✓' : '✗'}</span>
                    <span>
                      외주 {outsourceSummary.total}건 중 {outsourceSummary.completed}건 완료
                      {outsourceSummary.incomplete > 0 && ` (${outsourceSummary.incomplete}건 미완료)`}
                    </span>
                  </div>
                </div>
              )
            ) : null}
          </div>
        )}

        {/* inquiry→quotation: 모델/자재 등록 현황 */}
        {isQuotationTransition && (
          <div className="space-y-2 py-2">
            <p className="text-sm font-medium">사전 등록 현황</p>
            {!readinessLoaded ? (
              <p className="text-sm text-muted-foreground">확인 중...</p>
            ) : readiness ? (
              <div className="space-y-1 text-sm">
                <div className={`flex items-center gap-2 ${readiness.hasModels ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                  <span>{readiness.hasModels ? '✓' : '✗'}</span>
                  <span>모델 {readiness.modelCount}건 등록{!readiness.hasModels && ' (필수)'}</span>
                </div>
                <div className={`flex items-center gap-2 ${readiness.hasMaterials ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                  <span>{readiness.hasMaterials ? '✓' : '✗'}</span>
                  <span>자재 {readiness.materialCount}건 등록{!readiness.hasMaterials && ' (필수)'}</span>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* 필드 입력 폼 */}
        {missingFields.length > 0 && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              다음 항목을 입력해주세요:
            </p>
            {missingFields.map((field) => {
              const isRequired = field.required !== false;
              return (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>
                    {field.label}
                    {isRequired && <span className="text-destructive"> *</span>}
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
                  ) : field.type === 'textarea' ? (
                    <Textarea
                      id={field.key}
                      placeholder={`${field.label}을 입력하세요`}
                      value={formData[field.key]?.toString() || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      rows={3}
                    />
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
              );
            })}
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
