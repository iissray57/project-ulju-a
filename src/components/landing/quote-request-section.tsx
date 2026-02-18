'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const quoteSchema = z.object({
  customerName: z.string().min(2, '이름을 입력해주세요'),
  customerPhone: z.string().min(10, '연락처를 입력해주세요'),
  customerEmail: z.string().email('올바른 이메일을 입력해주세요').optional().or(z.literal('')),
  category: z.enum(['angle', 'curtain', 'system'], { message: '서비스를 선택해주세요' }),
  address: z.string().optional(),
  description: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

const CATEGORY_OPTIONS = [
  { value: 'angle', label: '앵글 옷장' },
  { value: 'curtain', label: '커튼' },
  { value: 'system', label: '시스템 수납' },
];

export function QuoteRequestSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
  });

  const selectedCategory = watch('category');

  const onSubmit = async (data: QuoteFormData) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('quote_requests').insert({
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: data.customerEmail || null,
        category: data.category,
        address: data.address || null,
        description: data.description || null,
      });

      if (error) {
        console.error('견적 요청 저장 실패:', error);
        return;
      }

      setIsSuccess(true);
      reset();
    } catch (error) {
      console.error('견적 요청 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <section id="quote-request" className="bg-slate-50 py-20 dark:bg-slate-900">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <div className="inline-flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400">
            <CheckCircle2 className="size-8" />
          </div>
          <h3 className="mt-6 text-2xl font-bold">견적 요청이 완료되었습니다</h3>
          <p className="mt-3 text-muted-foreground">
            빠른 시간 내에 연락드리겠습니다.<br />
            감사합니다.
          </p>
          <Button
            className="mt-8"
            variant="outline"
            onClick={() => setIsSuccess(false)}
          >
            새 견적 요청
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section id="quote-request" className="bg-slate-50 py-20 dark:bg-slate-900">
      <div className="mx-auto max-w-2xl px-4">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            무료 견적 상담
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            간단한 정보를 남겨주시면 빠르게 연락드리겠습니다
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-6">
          {/* Category Selection */}
          <div className="space-y-3">
            <Label>서비스 선택 *</Label>
            <RadioGroup
              value={selectedCategory}
              onValueChange={(value) => setValue('category', value as QuoteFormData['category'])}
              className="grid grid-cols-3 gap-3"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <Label
                  key={option.value}
                  className={cn(
                    'flex cursor-pointer items-center justify-center rounded-lg border-2 p-4 text-center transition-colors',
                    selectedCategory === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value={option.value} className="sr-only" />
                  <span className="text-sm font-medium">{option.label}</span>
                </Label>
              ))}
            </RadioGroup>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          {/* Name & Phone */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerName">이름 *</Label>
              <Input
                id="customerName"
                placeholder="홍길동"
                {...register('customerName')}
              />
              {errors.customerName && (
                <p className="text-sm text-destructive">{errors.customerName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">연락처 *</Label>
              <Input
                id="customerPhone"
                placeholder="010-0000-0000"
                {...register('customerPhone')}
              />
              {errors.customerPhone && (
                <p className="text-sm text-destructive">{errors.customerPhone.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="customerEmail">이메일 (선택)</Label>
            <Input
              id="customerEmail"
              type="email"
              placeholder="email@example.com"
              {...register('customerEmail')}
            />
            {errors.customerEmail && (
              <p className="text-sm text-destructive">{errors.customerEmail.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">시공 주소 (선택)</Label>
            <Input
              id="address"
              placeholder="울산 언양읍 ..."
              {...register('address')}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">요청사항 (선택)</Label>
            <Textarea
              id="description"
              placeholder="원하시는 시공 내용이나 문의사항을 자유롭게 작성해주세요"
              rows={4}
              {...register('description')}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                처리 중...
              </>
            ) : (
              '견적 요청하기'
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            제출하신 정보는 견적 상담 목적으로만 사용됩니다
          </p>
        </form>
      </div>
    </section>
  );
}
