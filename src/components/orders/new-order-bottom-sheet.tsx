'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createOrder } from '@/app/(dashboard)/orders/actions';
import { getCustomers } from '@/app/(dashboard)/customers/actions';
import type { Database } from '@/lib/database.types';
import { formatPhone } from '@/lib/utils';

type Customer = Database['public']['Tables']['customers']['Row'];

export function NewOrderBottomSheet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 고객 검색
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // 폼 상태
  const [workType, setWorkType] = useState<string>('');
  const [quotationAmount, setQuotationAmount] = useState('');
  const [measurementDate, setMeasurementDate] = useState('');

  // 고객 검색 debounced
  useEffect(() => {
    if (!customerSearch || customerSearch.length < 1) {
      setCustomers([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      const result = await getCustomers({ query: customerSearch, offset: 0, limit: 5 });
      if (result.data) {
        setCustomers(result.data);
        setShowDropdown(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setShowDropdown(false);
  };

  const resetForm = () => {
    setCustomerSearch('');
    setSelectedCustomer(null);
    setWorkType('');
    setQuotationAmount('');
    setMeasurementDate('');
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      toast.error('고객을 선택해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createOrder({
        customer_id: selectedCustomer.id,
        work_type:
          (workType as 'angle' | 'system' | 'mixed' | undefined) || undefined,
        quotation_amount: Number(quotationAmount) || 0,
        confirmed_amount: 0,
        measurement_date: measurementDate,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('주문이 등록되었습니다');
      setOpen(false);
      resetForm();
      if (result.data) {
        router.push(`/orders/${result.data.id}`);
      }
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <SheetTrigger asChild>
        <Button
          className="md:hidden fixed bottom-20 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
          size="icon"
          aria-label="빠른 주문 등록"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>빠른 주문 등록</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4">
          {/* 고객 선택 */}
          <div className="space-y-2">
            <Label>고객 선택</Label>
            <div className="relative">
              <Input
                placeholder="고객명 검색..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setSelectedCustomer(null);
                }}
              />
              {showDropdown && customers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                      onClick={() => selectCustomer(c)}
                    >
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{formatPhone(c.phone)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedCustomer && (
              <p className="text-xs text-muted-foreground">
                선택: {selectedCustomer.name} ({formatPhone(selectedCustomer.phone)})
              </p>
            )}
          </div>

          {/* 작업 유형 */}
          <div className="space-y-2">
            <Label>작업 유형</Label>
            <RadioGroup value={workType} onValueChange={setWorkType}>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="angle" id="bs-angle" />
                  <Label htmlFor="bs-angle" className="font-normal">
                    앵글
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="bs-system" />
                  <Label htmlFor="bs-system" className="font-normal">
                    시스템
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mixed" id="bs-mixed" />
                  <Label htmlFor="bs-mixed" className="font-normal">
                    혼합
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="curtain" id="bs-curtain" />
                  <Label htmlFor="bs-curtain" className="font-normal">
                    커튼
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="demolition" id="bs-demolition" />
                  <Label htmlFor="bs-demolition" className="font-normal">
                    철거
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* 견적 금액 */}
          <div className="space-y-2">
            <Label>견적 금액</Label>
            <Input
              type="number"
              placeholder="금액 입력"
              value={quotationAmount}
              onChange={(e) => setQuotationAmount(e.target.value)}
              min={0}
            />
          </div>

          {/* 실측일 (필수) */}
          <div className="space-y-2">
            <Label>실측일 <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={measurementDate}
              onChange={(e) => setMeasurementDate(e.target.value)}
            />
          </div>

          {/* 등록 버튼 */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedCustomer || !measurementDate}
          >
            {isSubmitting ? '등록 중...' : '주문 등록'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
