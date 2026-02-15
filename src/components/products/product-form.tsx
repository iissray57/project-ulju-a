'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  productFormSchema,
  type ProductFormData,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_MAIN_CATEGORY_LABELS,
  MAIN_TO_CATEGORIES,
  FRAME_COLORS,
  PANEL_COLORS,
  type ProductMainCategory,
} from '@/lib/schemas/product';
import { createProduct, updateProduct } from '@/app/(dashboard)/products/actions';
import { Button } from '@/components/ui/button';
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
import { useState } from 'react';
import { toast } from 'sonner';

interface ProductFormProps {
  productId?: string;
  defaultValues?: ProductFormData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductForm({ productId, defaultValues, onSuccess, onCancel }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultValues || {
      name: '',
      category: 'system_frame',
      sku: '',
      unit: 'EA',
      unit_price: 0,
      min_stock: 0,
      width: undefined,
      depth: undefined,
      height: undefined,
      color: '',
      memo: '',
      is_active: true,
    },
  });

  const selectedCategory = watch('category');

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);

    try {
      const result = productId
        ? await updateProduct(productId, data)
        : await createProduct(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(productId ? '품목이 수정되었습니다.' : '품목이 등록되었습니다.');
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/products');
      }
      router.refresh();
    } catch {
      toast.error('오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 카테고리 */}
      <div className="space-y-2">
        <Label htmlFor="category">카테고리 *</Label>
        <Select
          value={selectedCategory}
          onValueChange={(value) => setValue('category', value as ProductFormData['category'])}
        >
          <SelectTrigger>
            <SelectValue placeholder="카테고리 선택" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(MAIN_TO_CATEGORIES) as ProductMainCategory[]).map((main) => (
              <div key={main}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {PRODUCT_MAIN_CATEGORY_LABELS[main]}
                </div>
                {MAIN_TO_CATEGORIES[main].map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {PRODUCT_CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
      </div>

      {/* 품목명 */}
      <div className="space-y-2">
        <Label htmlFor="name">품목명 *</Label>
        <Input id="name" placeholder="예: 시스템장 프레임 실버 400x300" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      {/* SKU */}
      <div className="space-y-2">
        <Label htmlFor="sku">SKU (품목코드)</Label>
        <Input id="sku" placeholder="예: SF-SV-400-300" {...register('sku')} />
        {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
      </div>

      {/* 단위, 단가 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit">단위</Label>
          <Input id="unit" placeholder="EA" {...register('unit')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit_price">단가 (원)</Label>
          <Input
            id="unit_price"
            type="number"
            placeholder="0"
            {...register('unit_price', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* 최소재고 */}
      <div className="space-y-2">
        <Label htmlFor="min_stock">최소재고 수량</Label>
        <Input
          id="min_stock"
          type="number"
          placeholder="0"
          {...register('min_stock', { valueAsNumber: true })}
        />
        <p className="text-xs text-muted-foreground">
          가용 재고가 이 수량 미만이면 부족 재고로 표시됩니다
        </p>
      </div>

      {/* 규격 (가로, 깊이, 높이) */}
      <div className="space-y-2">
        <Label>규격 (mm)</Label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Input
              id="width"
              type="number"
              placeholder="가로"
              {...register('width', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground mt-1">가로</p>
          </div>
          <div>
            <Input
              id="depth"
              type="number"
              placeholder="깊이"
              {...register('depth', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground mt-1">깊이</p>
          </div>
          <div>
            <Input
              id="height"
              type="number"
              placeholder="높이"
              {...register('height', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground mt-1">높이</p>
          </div>
        </div>
      </div>

      {/* 색상 */}
      <div className="space-y-2">
        <Label htmlFor="color">색상</Label>
        <Select
          value={watch('color') || ''}
          onValueChange={(value) => setValue('color', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="색상 선택" />
          </SelectTrigger>
          <SelectContent>
            {selectedCategory === 'system_frame' ? (
              FRAME_COLORS.map((color) => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))
            ) : selectedCategory === 'top_panel' ? (
              PANEL_COLORS.map((color) => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))
            ) : (
              [...FRAME_COLORS, ...PANEL_COLORS]
                .filter((v, i, a) => a.indexOf(v) === i)
                .map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 메모 */}
      <div className="space-y-2">
        <Label htmlFor="memo">메모</Label>
        <Textarea id="memo" placeholder="메모 입력" rows={3} {...register('memo')} />
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel || (() => router.back())}>
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : productId ? '수정' : '등록'}
        </Button>
      </div>
    </form>
  );
}
