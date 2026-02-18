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
import { getSuppliers } from '@/app/(dashboard)/suppliers/actions';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Search, Building2, X } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
}

interface ProductFormProps {
  productId?: string;
  defaultValues?: ProductFormData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductForm({ productId, defaultValues, onSuccess, onCancel }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 거래처 관련 상태
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);

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
      setIsSupplierDialogOpen(false);
    },
    [setValue]
  );

  const clearSupplier = () => {
    setSelectedSupplier(null);
    setValue('supplier_id', undefined);
  };

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

      {/* 기본 거래처 (선택) */}
      <div className="space-y-2">
        <Label>기본 거래처 <span className="text-xs text-muted-foreground">(선택)</span></Label>
        <div className="flex items-center gap-2">
          {selectedSupplier ? (
            <div className="flex items-center gap-2 flex-1 px-3 py-2 border rounded-md bg-muted/50">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{selectedSupplier.name}</span>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={clearSupplier}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="flex-1 justify-start"
              onClick={() => setIsSupplierDialogOpen(true)}
            >
              <Search className="h-4 w-4 mr-2" />
              거래처 검색...
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          발주 시 기본으로 선택될 거래처입니다
        </p>
      </div>

      {/* 거래처 검색 다이얼로그 */}
      <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
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
