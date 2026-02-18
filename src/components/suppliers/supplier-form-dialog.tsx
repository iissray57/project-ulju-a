'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { supplierSchema, type SupplierFormData } from '@/lib/schemas/supplier';
import { createSupplier } from '@/app/(dashboard)/suppliers/actions';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface SupplierFormDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function SupplierFormDialog({ trigger, onSuccess }: SupplierFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
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

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const onSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true);

    try {
      const result = await createSupplier(data);

      if (result.error) {
        toast.error(result.error);
        setIsSubmitting(false);
        return;
      }

      toast.success('거래처가 등록되었습니다');
      reset();
      setOpen(false);
      router.refresh();
      onSuccess?.();
    } catch {
      toast.error('오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      setOpen(newOpen);
      if (!newOpen) {
        reset();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            신규 거래처 등록
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>신규 거래처 등록</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dialog-name">
              거래처명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dialog-name"
              {...register('name')}
              placeholder="거래처명을 입력하세요"
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-phone">연락처</Label>
            <Input
              id="dialog-phone"
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
            <Label htmlFor="dialog-contact_person">담당자</Label>
            <Input
              id="dialog-contact_person"
              {...register('contact_person')}
              placeholder="담당자명을 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-business_number">사업자번호</Label>
            <Input
              id="dialog-business_number"
              {...register('business_number')}
              placeholder="000-00-00000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-address">주소</Label>
            <Input
              id="dialog-address"
              {...register('address')}
              placeholder="주소를 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-memo">메모</Label>
            <Textarea
              id="dialog-memo"
              {...register('memo')}
              placeholder="메모를 입력하세요"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="dialog-is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue('is_active', checked === true)}
            />
            <Label htmlFor="dialog-is_active" className="cursor-pointer">
              활성 상태
            </Label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '처리 중...' : '등록'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
