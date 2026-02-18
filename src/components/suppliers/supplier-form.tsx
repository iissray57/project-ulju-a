'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supplierSchema, type SupplierFormData } from '@/lib/schemas/supplier';
import { createSupplier, updateSupplier } from '@/app/(dashboard)/suppliers/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatPhone } from '@/lib/utils';

interface SupplierFormProps {
  supplierId?: string;
  defaultValues?: SupplierFormData;
}

export function SupplierForm({ supplierId, defaultValues }: SupplierFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: defaultValues || {
      name: '',
      phone: '',
      address: '',
      business_number: '',
      contact_person: '',
      memo: '',
      is_active: true,
    },
  });

  const isActive = watch('is_active');


  const onSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true);

    try {
      const result = supplierId
        ? await updateSupplier(supplierId, data)
        : await createSupplier(data);

      if (result.error) {
        toast.error(result.error);
        setIsSubmitting(false);
        return;
      }

      toast.success(supplierId ? '거래처 정보가 수정되었습니다' : '거래처가 등록되었습니다');
      router.push('/suppliers');
      router.refresh();
    } catch {
      toast.error('오류가 발생했습니다');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          거래처명 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="거래처명을 입력하세요"
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">연락처</Label>
        <Input
          id="phone"
          {...register('phone')}
          placeholder="000-0000-0000"
          onChange={(e) => {
            const formatted = formatPhone(e.target.value);
            setValue('phone', formatted);
          }}
          aria-invalid={!!errors.phone}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact_person">담당자</Label>
        <Input
          id="contact_person"
          {...register('contact_person')}
          placeholder="담당자명을 입력하세요"
          aria-invalid={!!errors.contact_person}
        />
        {errors.contact_person && (
          <p className="text-sm text-destructive">{errors.contact_person.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="business_number">사업자번호</Label>
        <Input
          id="business_number"
          {...register('business_number')}
          placeholder="000-00-00000"
          aria-invalid={!!errors.business_number}
        />
        {errors.business_number && (
          <p className="text-sm text-destructive">{errors.business_number.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">주소</Label>
        <Input
          id="address"
          {...register('address')}
          placeholder="주소를 입력하세요"
          aria-invalid={!!errors.address}
        />
        {errors.address && (
          <p className="text-sm text-destructive">{errors.address.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="memo">메모</Label>
        <Textarea
          id="memo"
          {...register('memo')}
          placeholder="메모를 입력하세요"
          rows={4}
          aria-invalid={!!errors.memo}
        />
        {errors.memo && (
          <p className="text-sm text-destructive">{errors.memo.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          checked={isActive}
          onCheckedChange={(checked) => setValue('is_active', checked === true)}
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          활성 상태
        </Label>
      </div>

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
          {isSubmitting ? '처리 중...' : supplierId ? '수정' : '등록'}
        </Button>
      </div>
    </form>
  );
}
