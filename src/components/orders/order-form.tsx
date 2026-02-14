'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orderFormSchema, type OrderFormData } from '@/lib/schemas/order';
import { createOrder, updateOrder } from '@/app/(dashboard)/orders/actions';
import { getCustomers } from '@/app/(dashboard)/customers/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { Database } from '@/lib/database.types';

type Customer = Database['public']['Tables']['customers']['Row'];

interface OrderFormProps {
  orderId?: string;
  defaultValues?: OrderFormData;
}

export function OrderForm({ orderId, defaultValues }: OrderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: defaultValues
      ? {
          ...defaultValues,
          quotation_amount: defaultValues.quotation_amount ?? 0,
          confirmed_amount: defaultValues.confirmed_amount ?? 0,
        }
      : {
          customer_id: '',
          closet_type: undefined,
          quotation_amount: 0,
          confirmed_amount: 0,
          measurement_date: '',
          installation_date: '',
          site_address: '',
          site_memo: '',
          memo: '',
        },
  });

  const closetType = watch('closet_type');

  // Load customer info if editing existing order
  useEffect(() => {
    if (defaultValues?.customer_id) {
      // Load customer info
      const loadCustomer = async () => {
        const result = await getCustomers({ query: '', offset: 0, limit: 100 });
        if (result.data) {
          const customer = result.data.find((c) => c.id === defaultValues.customer_id);
          if (customer) {
            setSelectedCustomer(customer);
            setCustomerSearch(customer.name);
          }
        }
      };
      loadCustomer();
    }
  }, [defaultValues?.customer_id]);

  // Debounced customer search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (customerSearch.trim()) {
        const result = await getCustomers({ query: customerSearch, offset: 0, limit: 10 });
        if (result.data) {
          setCustomers(result.data);
          setShowCustomerDropdown(true);
        }
      } else {
        setCustomers([]);
        setShowCustomerDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearch]);

  const handleCustomerSelect = useCallback(
    (customer: Customer) => {
      setSelectedCustomer(customer);
      setCustomerSearch(customer.name);
      setValue('customer_id', customer.id);
      setShowCustomerDropdown(false);
    },
    [setValue]
  );

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);

    try {
      const result = orderId ? await updateOrder(orderId, data) : await createOrder(data);

      if (result.error) {
        toast.error(result.error);
        setIsSubmitting(false);
        return;
      }

      toast.success(orderId ? '수주 정보가 수정되었습니다' : '수주가 등록되었습니다');
      router.push('/orders');
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
      {/* Customer Selection Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">고객 정보</h2>
        <div className="space-y-2">
          <Label htmlFor="customer">
            고객 선택 <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="customer"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="고객명으로 검색하세요"
              aria-invalid={!!errors.customer_id}
            />
            {showCustomerDropdown && customers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleCustomerSelect(customer)}
                    className="w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">{customer.phone}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedCustomer && (
            <div className="p-3 bg-muted rounded-md text-sm border">
              <div>
                <span className="font-medium">선택된 고객:</span> {selectedCustomer.name}
              </div>
              <div className="text-muted-foreground">{selectedCustomer.phone}</div>
            </div>
          )}
          {errors.customer_id && (
            <p className="text-sm text-destructive">{errors.customer_id.message}</p>
          )}
          <Link
            href="/customers/new"
            className="inline-block text-sm text-primary hover:underline"
          >
            + 신규 고객 등록
          </Link>
        </div>
      </div>

      {/* Closet Specification Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">옷장 사양</h2>
        <div className="space-y-2">
          <Label>옷장 유형</Label>
          <RadioGroup value={closetType} onValueChange={(value) => setValue('closet_type', value as 'angle' | 'system' | 'mixed')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="angle" id="angle" />
              <Label htmlFor="angle" className="font-normal cursor-pointer">
                앵글
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="font-normal cursor-pointer">
                시스템
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mixed" id="mixed" />
              <Label htmlFor="mixed" className="font-normal cursor-pointer">
                혼합
              </Label>
            </div>
          </RadioGroup>
          {errors.closet_type && (
            <p className="text-sm text-destructive">{errors.closet_type.message}</p>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          * Phase 1: 유형만 입력. Phase 2에서 2D/3D 모델링 기능 추가 예정
        </p>
      </div>

      {/* Amount Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">금액</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quotation_amount">견적 금액 (원)</Label>
            <Input
              id="quotation_amount"
              type="text"
              {...register('quotation_amount', {
                setValueAs: (v) => (v === '' ? 0 : Number(v.replace(/[^\d]/g, ''))),
              })}
              onChange={(e) => {
                const formatted = formatCurrency(e.target.value);
                e.target.value = formatted;
              }}
              placeholder="0"
              aria-invalid={!!errors.quotation_amount}
            />
            {errors.quotation_amount && (
              <p className="text-sm text-destructive">{errors.quotation_amount.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmed_amount">확정 금액 (원)</Label>
            <Input
              id="confirmed_amount"
              type="text"
              {...register('confirmed_amount', {
                setValueAs: (v) => (v === '' ? 0 : Number(v.replace(/[^\d]/g, ''))),
              })}
              onChange={(e) => {
                const formatted = formatCurrency(e.target.value);
                e.target.value = formatted;
              }}
              placeholder="0"
              aria-invalid={!!errors.confirmed_amount}
            />
            {errors.confirmed_amount && (
              <p className="text-sm text-destructive">{errors.confirmed_amount.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">일정</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="measurement_date">실측일</Label>
            <Input
              id="measurement_date"
              type="date"
              {...register('measurement_date')}
              aria-invalid={!!errors.measurement_date}
            />
            {errors.measurement_date && (
              <p className="text-sm text-destructive">{errors.measurement_date.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="installation_date">설치일</Label>
            <Input
              id="installation_date"
              type="date"
              {...register('installation_date')}
              aria-invalid={!!errors.installation_date}
            />
            {errors.installation_date && (
              <p className="text-sm text-destructive">{errors.installation_date.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Site Information Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">현장 정보</h2>
        <div className="space-y-2">
          <Label htmlFor="site_address">현장 주소</Label>
          <Input
            id="site_address"
            {...register('site_address')}
            placeholder="현장 주소를 입력하세요"
            aria-invalid={!!errors.site_address}
          />
          {errors.site_address && (
            <p className="text-sm text-destructive">{errors.site_address.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="site_memo">현장 메모</Label>
          <Textarea
            id="site_memo"
            {...register('site_memo')}
            placeholder="현장 관련 메모를 입력하세요"
            rows={3}
            aria-invalid={!!errors.site_memo}
          />
          {errors.site_memo && (
            <p className="text-sm text-destructive">{errors.site_memo.message}</p>
          )}
        </div>
      </div>

      {/* Memo Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">메모</h2>
        <div className="space-y-2">
          <Label htmlFor="memo">일반 메모</Label>
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
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting} className="w-full sm:w-auto">
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? '처리 중...' : orderId ? '수정' : '등록'}
        </Button>
      </div>
    </form>
  );
}
