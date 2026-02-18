'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  createOutsourceOrder,
  updateOutsourceOrder,
  transitionOutsourceStatus,
  deleteOutsourceOrder,
  type OutsourceOrderWithSupplier,
  type OutsourceStatus,
  type OutsourceType,
} from '@/app/(dashboard)/orders/outsource-actions';
import { getSuppliers } from '@/app/(dashboard)/suppliers/actions';
import { OutsourceOrderPDFButton } from '@/components/orders/outsource-order-pdf-button';

const OUTSOURCE_TYPE_LABELS: Record<OutsourceType, string> = {
  system: '시스템장',
  curtain: '커튼',
};

const OUTSOURCE_STATUS_LABELS: Record<OutsourceStatus, string> = {
  requested: '의뢰',
  in_progress: '제작중',
  completed: '완료',
  cancelled: '취소',
};

// 상태 전이 맵
const NEXT_STATUS_MAP: Record<OutsourceStatus, OutsourceStatus[]> = {
  requested: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const STATUS_BUTTON_LABELS: Record<OutsourceStatus, string> = {
  in_progress: '제작 시작',
  completed: '완료 처리',
  cancelled: '취소',
  requested: '의뢰',
};

interface SupplierOption {
  id: string;
  name: string;
  phone: string | null;
}

interface OutsourceOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  outsourceOrder: OutsourceOrderWithSupplier | null;
  onSaved: () => void;
}

export function OutsourceOrderDialog({
  open,
  onOpenChange,
  orderId,
  outsourceOrder,
  onSaved,
}: OutsourceOrderDialogProps) {
  const isEditMode = outsourceOrder !== null;

  // 폼 상태
  const [outsourceType, setOutsourceType] = useState<OutsourceType>('system');
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierOption | null>(null);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [specSummary, setSpecSummary] = useState('');
  const [memo, setMemo] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 다이얼로그 열릴 때 초기화
  useEffect(() => {
    if (open) {
      if (outsourceOrder) {
        setOutsourceType(outsourceOrder.outsource_type as OutsourceType);
        setSelectedSupplier(
          outsourceOrder.supplier
            ? {
                id: outsourceOrder.supplier.id,
                name: outsourceOrder.supplier.name,
                phone: outsourceOrder.supplier.phone,
              }
            : null
        );
        setSupplierSearch(outsourceOrder.supplier?.name ?? '');
        setSpecSummary(outsourceOrder.spec_summary ?? '');
        setMemo(outsourceOrder.memo ?? '');
        setAmount(outsourceOrder.amount != null ? String(outsourceOrder.amount) : '');
        setDueDate(outsourceOrder.due_date ? outsourceOrder.due_date.slice(0, 10) : '');
      } else {
        setOutsourceType('system');
        setSelectedSupplier(null);
        setSupplierSearch('');
        setSpecSummary('');
        setMemo('');
        setAmount('');
        setDueDate('');
      }
      setSuppliers([]);
    }
  }, [open, outsourceOrder]);

  // 거래처 디바운스 검색
  const searchSuppliers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuppliers([]);
      return;
    }
    setIsSearching(true);
    const result = await getSuppliers({ query, isActive: true, limit: 20 });
    if (result.data) {
      setSuppliers(
        result.data.map((s) => ({ id: s.id, name: s.name, phone: s.phone }))
      );
    }
    setIsSearching(false);
  }, []);

  useEffect(() => {
    // 이미 선택된 거래처 이름과 검색어가 같으면 검색 안 함
    if (selectedSupplier && supplierSearch === selectedSupplier.name) return;
    const timer = setTimeout(() => searchSuppliers(supplierSearch), 300);
    return () => clearTimeout(timer);
  }, [supplierSearch, searchSuppliers, selectedSupplier]);

  const handleSave = async () => {
    if (!selectedSupplier) {
      toast.error('거래처를 선택해주세요.');
      return;
    }

    setIsSaving(true);

    const amountNum = amount.trim() ? Number(amount) : 0;

    if (isEditMode && outsourceOrder) {
      const result = await updateOutsourceOrder(outsourceOrder.id, {
        supplier_id: selectedSupplier.id,
        spec_summary: specSummary || null,
        memo: memo || null,
        amount: amountNum,
        due_date: dueDate || null,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('외주 발주가 수정되었습니다.');
        onSaved();
        onOpenChange(false);
      }
    } else {
      const result = await createOutsourceOrder({
        order_id: orderId,
        outsource_type: outsourceType,
        supplier_id: selectedSupplier.id,
        spec_summary: specSummary || null,
        memo: memo || null,
        amount: amountNum,
        due_date: dueDate || null,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('외주 발주가 생성되었습니다.');
        onSaved();
        onOpenChange(false);
      }
    }

    setIsSaving(false);
  };

  const handleTransition = async (newStatus: OutsourceStatus) => {
    if (!outsourceOrder) return;
    setIsTransitioning(true);

    const result = await transitionOutsourceStatus(outsourceOrder.id, newStatus);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`상태가 "${OUTSOURCE_STATUS_LABELS[newStatus]}"로 변경되었습니다.`);
      onSaved();
      onOpenChange(false);
    }

    setIsTransitioning(false);
  };

  const handleDelete = async () => {
    if (!outsourceOrder) return;
    if (!confirm('이 외주 발주를 삭제하시겠습니까?')) return;

    setIsDeleting(true);
    const result = await deleteOutsourceOrder(outsourceOrder.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('외주 발주가 삭제되었습니다.');
      onSaved();
      onOpenChange(false);
    }
    setIsDeleting(false);
  };

  const currentStatus = outsourceOrder?.status as OutsourceStatus | undefined;
  const nextStatuses = currentStatus ? NEXT_STATUS_MAP[currentStatus] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>
              {isEditMode ? '외주 발주 상세' : '외주 발주 추가'}
            </DialogTitle>
            {isEditMode && currentStatus && (
              <Badge
                variant="secondary"
                className={
                  currentStatus === 'requested'
                    ? 'bg-yellow-500/10 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
                    : currentStatus === 'in_progress'
                      ? 'bg-blue-500/10 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                      : currentStatus === 'completed'
                        ? 'bg-green-500/10 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                        : 'bg-red-500/10 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                }
              >
                {OUTSOURCE_STATUS_LABELS[currentStatus]}
              </Badge>
            )}
          </div>
          {isEditMode && (
            <p className="text-sm text-muted-foreground font-mono">
              {outsourceOrder?.outsource_number}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* 유형 선택 (생성 모드에서만) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label>유형</Label>
              <div className="flex gap-3">
                {(Object.entries(OUTSOURCE_TYPE_LABELS) as [OutsourceType, string][]).map(
                  ([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setOutsourceType(value)}
                      className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${
                        outsourceType === value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-accent'
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* 편집 모드에서 유형 표시 */}
          {isEditMode && (
            <div className="space-y-1">
              <Label>유형</Label>
              <p className="text-sm text-foreground">
                {OUTSOURCE_TYPE_LABELS[outsourceOrder?.outsource_type as OutsourceType] ??
                  outsourceOrder?.outsource_type}
              </p>
            </div>
          )}

          {/* 거래처 검색 */}
          <div className="space-y-2">
            <Label>거래처</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="거래처명으로 검색"
                value={supplierSearch}
                onChange={(e) => {
                  setSupplierSearch(e.target.value);
                  if (selectedSupplier && e.target.value !== selectedSupplier.name) {
                    setSelectedSupplier(null);
                  }
                }}
                className="pl-9"
              />
            </div>

            {/* 검색 결과 */}
            {isSearching ? (
              <div className="flex justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : suppliers.length > 0 && !selectedSupplier ? (
              <div className="max-h-36 overflow-y-auto border rounded-md divide-y">
                {suppliers.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedSupplier(s);
                      setSupplierSearch(s.name);
                      setSuppliers([]);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">{s.name}</div>
                    {s.phone && (
                      <div className="text-xs text-muted-foreground">{s.phone}</div>
                    )}
                  </button>
                ))}
              </div>
            ) : null}

            {selectedSupplier && (
              <p className="text-xs text-muted-foreground">
                선택됨: {selectedSupplier.name}
              </p>
            )}
          </div>

          {/* 스펙 요약 */}
          <div className="space-y-2">
            <Label htmlFor="spec-summary">스펙 요약</Label>
            <Textarea
              id="spec-summary"
              placeholder="사이즈, 색상 등 스펙 정보"
              value={specSummary}
              onChange={(e) => setSpecSummary(e.target.value)}
              rows={2}
            />
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <Label htmlFor="memo">메모</Label>
            <Textarea
              id="memo"
              placeholder="특이사항 등"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
            />
          </div>

          {/* 외주비 + 납기 예정일 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">외주비 (원)</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due-date">납기 예정일</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {/* 왼쪽: PDF 버튼 + 삭제 버튼 */}
          <div className="flex gap-2">
            {isEditMode && outsourceOrder && (
              <OutsourceOrderPDFButton
                outsourceOrderId={outsourceOrder.id}
                outsourceNumber={outsourceOrder.outsource_number}
              />
            )}
            {isEditMode && currentStatus === 'requested' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting || isSaving || isTransitioning}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Trash2 className="mr-1 h-4 w-4" />
                삭제
              </Button>
            )}
          </div>

          {/* 오른쪽: 상태 전이 + 저장 */}
          <div className="flex gap-2 flex-wrap justify-end">
            {/* 상태 전이 버튼들 */}
            {isEditMode &&
              nextStatuses.map((nextStatus) => (
                <Button
                  key={nextStatus}
                  variant={nextStatus === 'cancelled' ? 'outline' : 'secondary'}
                  size="sm"
                  onClick={() => handleTransition(nextStatus)}
                  disabled={isTransitioning || isSaving || isDeleting}
                >
                  {isTransitioning && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {STATUS_BUTTON_LABELS[nextStatus]}
                </Button>
              ))}

            <Button variant="outline" onClick={() => onOpenChange(false)}>
              닫기
            </Button>

            {/* 저장 버튼 (completed/cancelled 상태면 비활성) */}
            {(!isEditMode ||
              (currentStatus !== 'completed' && currentStatus !== 'cancelled')) && (
              <Button
                onClick={handleSave}
                disabled={isSaving || isTransitioning || isDeleting || !selectedSupplier}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? '수정' : '추가'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
