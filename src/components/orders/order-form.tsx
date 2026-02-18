'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orderFormSchema, type OrderFormData } from '@/lib/schemas/order';
import { createOrder, updateOrder } from '@/app/(dashboard)/orders/actions';
import { getCustomers, createCustomer } from '@/app/(dashboard)/customers/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Search, User, ChevronDown } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';
import { formatPhone } from '@/lib/utils';

type Customer = Database['public']['Tables']['customers']['Row'];

// 10분 단위 시간 옵션 생성 (06:00 ~ 22:00)
function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let min = 0; min < 60; min += 10) {
      const value = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const label = `${hour}:${min.toString().padStart(2, '0')}`;
      options.push({ value, label });
    }
  }
  return options;
}

// 섹션 요약 헬퍼 함수들
function summarizeAmount(quotation: number | undefined, confirmed: number | undefined): string {
  if (!quotation && !confirmed) return '미입력';
  const parts: string[] = [];
  if (quotation) parts.push(`견적 ${quotation.toLocaleString('ko-KR')}원`);
  if (confirmed) parts.push(`확정 ${confirmed.toLocaleString('ko-KR')}원`);
  return parts.join(' / ');
}

function summarizeSchedule(measurement: string | undefined, installation: string | undefined): string {
  const parts: string[] = [];
  if (measurement) {
    parts.push(`실측 ${new Date(measurement).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`);
  }
  if (installation) {
    parts.push(`설치 ${new Date(installation).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`);
  }
  return parts.length ? parts.join(' / ') : '미입력';
}

function summarizeSite(address: string | undefined): string {
  return address || '미입력';
}

function summarizeWorkSpec(workType: string | undefined, width?: number, height?: number, depth?: number): string {
  if (!workType) return '미선택';
  const typeLabels: Record<string, string> = {
    angle: '앵글', system: '시스템', mixed: '혼합', curtain: '커튼', demolition: '철거',
  };
  const label = typeLabels[workType] || workType;
  const dims = [width, height, depth].filter(Boolean);
  if (dims.length) return `${label} ${dims.join('×')}mm`;
  return label;
}

interface OrderFormProps {
  orderId?: string;
  defaultValues?: OrderFormData;
}

export function OrderForm({ orderId, defaultValues }: OrderFormProps) {
  const router = useRouter();
  const isEditMode = !!orderId;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);

  // 신규 고객 입력
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  // 할인율 관련
  const [useDiscount, setUseDiscount] = useState(false);
  const [discountRate, setDiscountRate] = useState(0);

  // 방문 시간
  const [measurementTime, setMeasurementTime] = useState('');
  const [installationTime, setInstallationTime] = useState('');
  const timeOptions = useMemo(() => generateTimeOptions(), []);

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
          work_type: undefined,
          quotation_amount: 0,
          confirmed_amount: 0,
          measurement_date: '',
          installation_date: '',
          site_address: '',
          site_memo: '',
          memo: '',
        },
  });

  const closetType = watch('work_type');
  const quotationAmount = watch('quotation_amount');
  const confirmedAmount = watch('confirmed_amount');
  const measurementDate = watch('measurement_date');
  const installationDate = watch('installation_date');
  const siteAddress = watch('site_address');
  const specWidth = watch('work_spec.width');
  const specHeight = watch('work_spec.height');
  const specDepth = watch('work_spec.depth');

  // 할인율 적용 시 확정 금액 자동 계산
  useEffect(() => {
    if (useDiscount && quotationAmount && discountRate > 0) {
      const discounted = Math.round(quotationAmount * (1 - discountRate / 100));
      setValue('confirmed_amount', discounted);
    }
  }, [useDiscount, quotationAmount, discountRate, setValue]);

  // Load customer info if editing existing order
  useEffect(() => {
    if (defaultValues?.customer_id) {
      const loadCustomer = async () => {
        const result = await getCustomers({ query: '', offset: 0, limit: 100 });
        if (result.data) {
          const customer = result.data.find((c) => c.id === defaultValues.customer_id);
          if (customer) {
            setSelectedCustomer(customer);
            setCustomerSearch(customer.name);
            setNewCustomerName(customer.name);
            setNewCustomerPhone(customer.phone || '');
            setNewCustomerAddress(customer.address || '');
          }
        }
      };
      loadCustomer();
    }
  }, [defaultValues?.customer_id]);

  // 다이얼로그 열릴 때 고객 목록 로드
  useEffect(() => {
    if (isCustomerDialogOpen) {
      const loadCustomers = async () => {
        const result = await getCustomers({ query: customerSearch.trim(), offset: 0, limit: 20 });
        if (result.data) {
          setCustomers(result.data);
        }
      };
      const timer = setTimeout(loadCustomers, 200);
      return () => clearTimeout(timer);
    }
  }, [isCustomerDialogOpen, customerSearch]);

  const handleCustomerSelect = useCallback(
    (customer: Customer) => {
      setSelectedCustomer(customer);
      setValue('customer_id', customer.id);
      setNewCustomerName(customer.name);
      setNewCustomerPhone(customer.phone || '');
      setNewCustomerAddress(customer.address || '');
      if (customer.address) {
        setValue('site_address', customer.address);
      }
      setIsCustomerDialogOpen(false);
    },
    [setValue]
  );

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);

    try {
      // 신규 고객 등록 (기존 고객 선택 안 했을 때)
      if (!selectedCustomer && !orderId) {
        if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
          toast.error('고객명과 연락처는 필수입니다');
          setIsSubmitting(false);
          return;
        }

        const customerResult = await createCustomer({
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim(),
          address: newCustomerAddress.trim() || undefined,
        });

        if (customerResult.error) {
          toast.error(`고객 등록 실패: ${customerResult.error}`);
          setIsSubmitting(false);
          return;
        }

        if (customerResult.data) {
          data.customer_id = customerResult.data.id;
          toast.success('고객이 등록되었습니다');
        }
      }

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

  // 고객 정보 입력 블록 (공통)
  const CustomerSection = (
    <div className="space-y-4">
      <div className="space-y-4 p-4 border rounded-lg bg-background">
        {/* 기존 고객 불러오기 버튼 */}
        <div className="flex items-center justify-between">
          <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                기존 고객 불러오기
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>기존 고객 정보 불러오기</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="고객명 또는 연락처로 검색"
                  autoFocus
                />
                <div className="max-h-60 overflow-auto border rounded-md">
                  {customers.length > 0 ? (
                    customers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleCustomerSelect(customer)}
                        className="w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">{formatPhone(customer.phone)}</div>
                            {customer.address && (
                              <div className="text-xs text-muted-foreground truncate">{customer.address}</div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-muted-foreground">
                      {customerSearch ? '검색 결과가 없습니다' : '등록된 고객이 없습니다'}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {selectedCustomer && (
            <span className="text-sm text-muted-foreground">
              기존 고객: {selectedCustomer.name}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="newCustomerName">
              고객명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="newCustomerName"
              value={newCustomerName}
              onChange={(e) => {
                setNewCustomerName(e.target.value);
                if (selectedCustomer && e.target.value !== selectedCustomer.name) {
                  setSelectedCustomer(null);
                  setValue('customer_id', '');
                }
              }}
              placeholder="홍길동"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newCustomerPhone">
              연락처 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="newCustomerPhone"
              value={newCustomerPhone}
              onChange={(e) => {
                setNewCustomerPhone(formatPhone(e.target.value));
                if (selectedCustomer) {
                  setSelectedCustomer(null);
                  setValue('customer_id', '');
                }
              }}
              placeholder="010-1234-5678"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // ── 신규 주문 폼 (최소 필드) ──────────────────────────────────────────
  if (!isEditMode) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 고객 정보 */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">고객 정보</h2>
          {CustomerSection}
        </div>

        {/* 작업 유형 */}
        <div className="space-y-2">
          <Label>작업 유형</Label>
          <Select
            value={closetType || ''}
            onValueChange={(value) => setValue('work_type', value as 'angle' | 'system' | 'mixed' | 'curtain' | 'demolition')}
          >
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="유형을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="angle">앵글</SelectItem>
              <SelectItem value="system">시스템</SelectItem>
              <SelectItem value="mixed">혼합</SelectItem>
              <SelectItem value="curtain">커튼</SelectItem>
              <SelectItem value="demolition">철거</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 실측일 */}
        <div className="space-y-2">
          <Label>실측일 <span className="text-muted-foreground text-xs">(미정 가능)</span></Label>
          <div className="flex gap-2">
            <Input
              id="measurement_date"
              type="date"
              className="flex-1 md:w-48 md:flex-none"
              {...register('measurement_date')}
            />
            <Select value={measurementTime} onValueChange={setMeasurementTime}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="시간" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {timeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 메모 */}
        <div className="space-y-2">
          <Label htmlFor="memo">메모 <span className="text-muted-foreground text-xs">(선택)</span></Label>
          <Textarea
            id="memo"
            {...register('memo')}
            placeholder="간단한 메모를 입력하세요"
            rows={3}
          />
        </div>

        {/* 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting} className="w-full sm:w-auto">
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? '처리 중...' : '등록'}
          </Button>
        </div>
      </form>
    );
  }

  // ── 수정 폼 (Collapsible 섹션) ────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      {/* 고객 정보 - 항상 펼침 */}
      <div className="space-y-3 pb-4 border-b">
        <h2 className="text-lg font-semibold">고객 정보</h2>
        {CustomerSection}
      </div>

      {/* 작업 유형/사양 */}
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger className="group flex w-full items-center justify-between py-3 text-lg font-semibold hover:bg-accent/50 rounded-lg px-3 transition-colors">
          <div className="flex items-center gap-3">
            <span>작업 유형 / 사양</span>
            <span className="text-sm font-normal text-muted-foreground">
              {summarizeWorkSpec(closetType, specWidth, specHeight, specDepth)}
            </span>
          </div>
          <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-4 space-y-4">
          <div className="space-y-2">
            <Label>상품 유형</Label>
            <Select
              value={closetType || ''}
              onValueChange={(value) => setValue('work_type', value as 'angle' | 'system' | 'mixed' | 'curtain' | 'demolition')}
            >
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="유형을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="angle">앵글</SelectItem>
                <SelectItem value="system">시스템</SelectItem>
                <SelectItem value="mixed">혼합</SelectItem>
                <SelectItem value="curtain">커튼</SelectItem>
                <SelectItem value="demolition">철거</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spec_width">가로 (mm)</Label>
              <Input
                id="spec_width"
                type="number"
                placeholder="예: 2400"
                value={specWidth || ''}
                onChange={(e) => setValue('work_spec.width', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spec_height">높이 (mm)</Label>
              <Input
                id="spec_height"
                type="number"
                placeholder="예: 2400"
                value={specHeight || ''}
                onChange={(e) => setValue('work_spec.height', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spec_depth">깊이 (mm)</Label>
              <Input
                id="spec_depth"
                type="number"
                placeholder="예: 600"
                value={specDepth || ''}
                onChange={(e) => setValue('work_spec.depth', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="spec_custom">상세 사양 (자유 입력)</Label>
            <Textarea
              id="spec_custom"
              placeholder="예: 선반 5단, 서랍 2개, 행거 1개 등"
              rows={3}
              value={watch('work_spec.custom_text') || ''}
              onChange={(e) => setValue('work_spec.custom_text', e.target.value || undefined)}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 금액 */}
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger className="group flex w-full items-center justify-between py-3 text-lg font-semibold hover:bg-accent/50 rounded-lg px-3 transition-colors">
          <div className="flex items-center gap-3">
            <span>금액</span>
            <span className="text-sm font-normal text-muted-foreground">
              {summarizeAmount(quotationAmount, confirmedAmount)}
            </span>
          </div>
          <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="quotation_amount">견적 금액 (원)</Label>
              <Input
                id="quotation_amount"
                type="text"
                {...register('quotation_amount', {
                  setValueAs: (v) => (v === '' || v == null ? 0 : Number(String(v).replace(/[^\d]/g, ''))),
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
              <div className="flex items-center gap-2">
                <Checkbox
                  id="useDiscount"
                  checked={useDiscount}
                  onCheckedChange={(checked) => {
                    setUseDiscount(!!checked);
                    if (!checked) setDiscountRate(0);
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
              <Label htmlFor="confirmed_amount">확정 금액 (원)</Label>
              <Input
                id="confirmed_amount"
                type="text"
                {...register('confirmed_amount', {
                  setValueAs: (v) => (v === '' || v == null ? 0 : Number(String(v).replace(/[^\d]/g, ''))),
                })}
                onChange={(e) => {
                  const formatted = formatCurrency(e.target.value);
                  e.target.value = formatted;
                }}
                placeholder="0"
                aria-invalid={!!errors.confirmed_amount}
                disabled={useDiscount}
              />
              {useDiscount && quotationAmount && quotationAmount > 0 && discountRate > 0 && (
                <p className="text-sm text-muted-foreground">
                  {quotationAmount.toLocaleString()}원 - {discountRate}% = {Math.round(quotationAmount * (1 - discountRate / 100)).toLocaleString()}원
                </p>
              )}
              {errors.confirmed_amount && (
                <p className="text-sm text-destructive">{errors.confirmed_amount.message}</p>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 일정 */}
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger className="group flex w-full items-center justify-between py-3 text-lg font-semibold hover:bg-accent/50 rounded-lg px-3 transition-colors">
          <div className="flex items-center gap-3">
            <span>일정</span>
            <span className="text-sm font-normal text-muted-foreground">
              {summarizeSchedule(measurementDate, installationDate)}
            </span>
          </div>
          <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <Label>실측일 <span className="text-muted-foreground text-xs">(미정 가능)</span></Label>
              <div className="flex gap-2">
                <Input
                  id="measurement_date"
                  type="date"
                  className="flex-1"
                  {...register('measurement_date')}
                />
                <Select value={measurementTime} onValueChange={setMeasurementTime}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="시간" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {timeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>설치일 <span className="text-muted-foreground text-xs">(미정 가능)</span></Label>
              <div className="flex gap-2">
                <Input
                  id="installation_date"
                  type="date"
                  className="flex-1"
                  {...register('installation_date')}
                />
                <Select value={installationTime} onValueChange={setInstallationTime}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="시간" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {timeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 현장 정보 */}
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger className="group flex w-full items-center justify-between py-3 text-lg font-semibold hover:bg-accent/50 rounded-lg px-3 transition-colors">
          <div className="flex items-center gap-3">
            <span>현장 정보</span>
            <span className="text-sm font-normal text-muted-foreground">
              {summarizeSite(siteAddress)}
            </span>
          </div>
          <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-4 space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="site_address">현장 주소</Label>
            <Input
              id="site_address"
              {...register('site_address')}
              placeholder="현장 주소를 입력하세요"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site_memo">현장 메모</Label>
            <Textarea
              id="site_memo"
              {...register('site_memo')}
              placeholder="현장 관련 메모를 입력하세요"
              rows={3}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 메모 */}
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger className="group flex w-full items-center justify-between py-3 text-lg font-semibold hover:bg-accent/50 rounded-lg px-3 transition-colors">
          <div className="flex items-center gap-3">
            <span>메모</span>
            <span className="text-sm font-normal text-muted-foreground">
              {watch('memo') ? watch('memo')!.slice(0, 30) + (watch('memo')!.length > 30 ? '…' : '') : '미입력'}
            </span>
          </div>
          <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="memo">일반 메모</Label>
            <Textarea
              id="memo"
              {...register('memo')}
              placeholder="메모를 입력하세요"
              rows={4}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 버튼 */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting} className="w-full sm:w-auto">
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? '처리 중...' : '수정'}
        </Button>
      </div>
    </form>
  );
}
