'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { purchaseOrderFormSchema, type PurchaseOrderFormData } from '@/lib/schemas/purchase-order';
import { createPurchaseOrder, updatePurchaseOrder } from '@/app/(dashboard)/purchases/actions';
import { getSuppliers, createSupplier } from '@/app/(dashboard)/suppliers/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, Building2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  contact_person: string | null;
}

interface PurchaseOrderFormProps {
  poId?: string;
  defaultValues?: PurchaseOrderFormData;
}

export function PurchaseOrderForm({ poId, defaultValues }: PurchaseOrderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 거래처 관련 상태
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);

  // 신규 거래처 입력
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');

  // 할인율 관련
  const [useDiscount, setUseDiscount] = useState(false);
  const [discountRate, setDiscountRate] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderFormSchema),
    defaultValues: defaultValues
      ? {
          ...defaultValues,
          total_amount: defaultValues.total_amount ?? 0,
          order_date: defaultValues.order_date ?? new Date().toISOString().split('T')[0],
        }
      : {
          supplier_name: '',
          supplier_phone: '',
          order_date: new Date().toISOString().split('T')[0],
          subtotal_amount: 0,
          discount_rate: 0,
          total_amount: 0,
          payment_date: '',
          memo: '',
        },
  });

  const subtotalAmount = watch('subtotal_amount');

  // 할인율 적용 시 최종 금액 자동 계산
  useEffect(() => {
    if (useDiscount && subtotalAmount && discountRate > 0) {
      const discounted = Math.round(subtotalAmount * (1 - discountRate / 100));
      setValue('total_amount', discounted);
      setValue('discount_rate', discountRate);
    } else if (subtotalAmount) {
      setValue('total_amount', subtotalAmount);
      setValue('discount_rate', 0);
    }
  }, [useDiscount, subtotalAmount, discountRate, setValue]);

  // 거래처 검색
  useEffect(() => {
    if (isSupplierDialogOpen) {
      const loadSuppliers = async () => {
        const result = await getSuppliers({ query: supplierSearch.trim(), limit: 20 });
        if (result.data) {
          setSuppliers(result.data);
        }
      };
      const timer = setTimeout(loadSuppliers, 200);
      return () => clearTimeout(timer);
    }
  }, [isSupplierDialogOpen, supplierSearch]);

  const handleSupplierSelect = useCallback(
    (supplier: Supplier) => {
      setSelectedSupplier(supplier);
      setValue('supplier_id', supplier.id);
      setNewSupplierName(supplier.name);
      setNewSupplierPhone(supplier.phone || '');
      setValue('supplier_name', supplier.name);
      setValue('supplier_phone', supplier.phone || '');
      setIsSupplierDialogOpen(false);
    },
    [setValue]
  );

  // 전화번호 포맷
  const formatPhone = (value: string) => {
    const num = value.replace(/[^\d]/g, '');
    if (num.length <= 3) return num;
    if (num.length <= 7) return `${num.slice(0, 3)}-${num.slice(3)}`;
    return `${num.slice(0, 3)}-${num.slice(3, 7)}-${num.slice(7, 11)}`;
  };

  const onSubmit = async (data: PurchaseOrderFormData) => {
    setIsSubmitting(true);

    try {
      // 신규 거래처 등록 (기존 거래처 선택 안 했을 때)
      if (!selectedSupplier && !poId) {
        if (newSupplierName.trim()) {
          const supplierResult = await createSupplier({
            name: newSupplierName.trim(),
            phone: newSupplierPhone.trim() || undefined,
          });

          if (supplierResult.data) {
            data.supplier_id = supplierResult.data.id;
            data.supplier_name = supplierResult.data.name;
            data.supplier_phone = supplierResult.data.phone || '';
          }
        }
      }

      const result = poId
        ? await updatePurchaseOrder(poId, data)
        : await createPurchaseOrder(data);

      if (result.error) {
        toast.error(result.error);
        setIsSubmitting(false);
        return;
      }

      toast.success(poId ? '발주 정보가 수정되었습니다' : '발주가 등록되었습니다');

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
      {/* 거래처 정보 섹션 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">거래처 정보</h2>
        <div className="space-y-4 p-4 border rounded-lg bg-background">
          {/* 기존 거래처 불러오기 */}
          {!poId && (
            <div className="flex items-center justify-between">
              <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Search className="w-4 h-4 mr-2" />
                    기존 거래처 불러오기
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>거래처 검색</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      value={supplierSearch}
                      onChange={(e) => setSupplierSearch(e.target.value)}
                      placeholder="거래처명 또는 연락처로 검색"
                      autoFocus
                    />
                    <div className="max-h-60 overflow-auto border rounded-md">
                      {suppliers.length > 0 ? (
                        suppliers.map((supplier) => (
                          <button
                            key={supplier.id}
                            type="button"
                            onClick={() => handleSupplierSelect(supplier)}
                            className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              <Building2 className="w-5 h-5 text-muted-foreground shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium">{supplier.name}</div>
                                {supplier.phone && (
                                  <div className="text-sm text-muted-foreground">{supplier.phone}</div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-muted-foreground">
                          {supplierSearch ? '검색 결과가 없습니다' : '등록된 거래처가 없습니다'}
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              {selectedSupplier && (
                <span className="text-sm text-muted-foreground">
                  선택됨: {selectedSupplier.name}
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newSupplierName">거래처명</Label>
              <Input
                id="newSupplierName"
                value={newSupplierName}
                onChange={(e) => {
                  setNewSupplierName(e.target.value);
                  setValue('supplier_name', e.target.value);
                  if (selectedSupplier && e.target.value !== selectedSupplier.name) {
                    setSelectedSupplier(null);
                    setValue('supplier_id', undefined);
                  }
                }}
                placeholder="거래처명 입력"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newSupplierPhone">연락처</Label>
              <Input
                id="newSupplierPhone"
                value={newSupplierPhone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  setNewSupplierPhone(formatted);
                  setValue('supplier_phone', formatted);
                }}
                placeholder="010-0000-0000"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 발주 정보 섹션 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">발주 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="order_date">발주일</Label>
            <Input
              id="order_date"
              type="date"
              {...register('order_date')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_date">결제 예정일</Label>
            <Input
              id="payment_date"
              type="date"
              {...register('payment_date')}
            />
          </div>
        </div>
      </div>

      {/* 금액 섹션 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">금액</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="subtotal_amount">발주 금액 (원)</Label>
            <Input
              id="subtotal_amount"
              type="text"
              {...register('subtotal_amount', {
                setValueAs: (v) => (v === '' || v == null ? 0 : Number(String(v).replace(/[^\d]/g, ''))),
              })}
              onChange={(e) => {
                const formatted = formatCurrency(e.target.value);
                e.target.value = formatted;
              }}
              placeholder="0"
            />
          </div>

          {/* 할인율 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="useDiscount"
                checked={useDiscount}
                onCheckedChange={(checked) => {
                  setUseDiscount(!!checked);
                  if (!checked) {
                    setDiscountRate(0);
                  }
                }}
              />
              <Label htmlFor="useDiscount" className="cursor-pointer">
                할인율 적용
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="discountRate"
                type="number"
                min={0}
                max={100}
                value={discountRate || ''}
                onChange={(e) => setDiscountRate(Number(e.target.value) || 0)}
                placeholder="0"
                disabled={!useDiscount}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_amount">최종 금액 (원)</Label>
            <Input
              id="total_amount"
              type="text"
              {...register('total_amount', {
                setValueAs: (v) => (v === '' || v == null ? 0 : Number(String(v).replace(/[^\d]/g, ''))),
              })}
              onChange={(e) => {
                const formatted = formatCurrency(e.target.value);
                e.target.value = formatted;
              }}
              placeholder="0"
              disabled={useDiscount}
            />
            {useDiscount && subtotalAmount && subtotalAmount > 0 && discountRate > 0 && (
              <p className="text-sm text-muted-foreground">
                {subtotalAmount.toLocaleString()}원 - {discountRate}% = {Math.round(subtotalAmount * (1 - discountRate / 100)).toLocaleString()}원
              </p>
            )}
            {errors.total_amount && (
              <p className="text-sm text-destructive">{errors.total_amount.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* 메모 섹션 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">메모</h2>
        <div className="space-y-2">
          <Textarea
            id="memo"
            {...register('memo')}
            placeholder="메모를 입력하세요"
            rows={4}
          />
        </div>
      </div>

      {/* 버튼 */}
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
