'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema, type CustomerInput } from '@/lib/schemas/customer';
import { createCustomer, updateCustomer } from '@/app/(dashboard)/customers/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';

interface CustomerFormProps {
  customerId?: string;
  defaultValues?: CustomerInput;
  onSuccess?: () => void;
}

export function CustomerForm({ customerId, defaultValues, onSuccess }: CustomerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: defaultValues || {
      name: '',
      phone: '',
      address: '',
      address_detail: '',
      memo: '',
    },
  });

  const onSubmit = async (data: CustomerInput) => {
    setIsSubmitting(true);

    try {
      const result = customerId
        ? await updateCustomer(customerId, data)
        : await createCustomer(data);

      if (result.error) {
        toast.error(result.error);
        setIsSubmitting(false);
        return;
      }

      toast.success(customerId ? '고객 정보가 수정되었습니다' : '고객이 등록되었습니다');
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/customers');
        router.refresh();
      }
    } catch {
      toast.error('오류가 발생했습니다');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          고객명 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="고객명을 입력하세요"
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          연락처 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone"
          {...register('phone')}
          placeholder="010-1234-5678"
          aria-invalid={!!errors.phone}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
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
        <Label htmlFor="address_detail">상세주소</Label>
        <Input
          id="address_detail"
          {...register('address_detail')}
          placeholder="상세주소를 입력하세요"
          aria-invalid={!!errors.address_detail}
        />
        {errors.address_detail && (
          <p className="text-sm text-destructive">{errors.address_detail.message}</p>
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

      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess ? onSuccess() : router.back()}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? '처리 중...' : customerId ? '수정' : '등록'}
        </Button>
      </div>
    </form>
  );
}
