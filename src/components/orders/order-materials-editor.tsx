'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/schemas/product';
import { getProducts } from '@/app/(dashboard)/products/actions';
import {
  getOrderMaterials,
  addOrderMaterial,
  removeOrderMaterial,
  updateOrderMaterial,
  type OrderMaterialWithProduct,
} from '@/app/(dashboard)/orders/material-actions';

interface OrderMaterialsEditorProps {
  orderId: string;
}

export function OrderMaterialsEditor({ orderId }: OrderMaterialsEditorProps) {
  const [materials, setMaterials] = useState<OrderMaterialWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadMaterials = useCallback(async () => {
    const result = await getOrderMaterials(orderId);
    if (result.data) {
      setMaterials(result.data);
    }
    setIsLoading(false);
  }, [orderId]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const handleRemove = async (materialId: string) => {
    const result = await removeOrderMaterial(materialId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('자재가 삭제되었습니다');
    loadMaterials();
  };

  const handleQuantityChange = async (materialId: string, quantity: number) => {
    if (quantity < 0) return;
    const result = await updateOrderMaterial(materialId, { planned_quantity: quantity });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    loadMaterials();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>자재 현황</CardTitle>
        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          자재 추가
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : materials.length === 0 ? (
          <div className="text-muted-foreground text-sm text-center py-8">
            등록된 자재가 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>품목명</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead className="text-right">계획 수량</TableHead>
                  <TableHead className="text-center">상태</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {m.product?.name || '-'}
                      {m.product?.sku && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({m.product.sku})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.product?.category
                        ? PRODUCT_CATEGORY_LABELS[
                            m.product.category as keyof typeof PRODUCT_CATEGORY_LABELS
                          ] || m.product.category
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        value={m.planned_quantity}
                        onChange={(e) =>
                          handleQuantityChange(m.id, parseInt(e.target.value) || 0)
                        }
                        className="w-20 text-right inline-block"
                      />
                      {m.product?.unit && (
                        <span className="text-muted-foreground ml-1 text-sm">
                          {m.product.unit}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {m.shortage_quantity > 0 ? (
                        <Badge variant="destructive">부족</Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-green-500/10 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                        >
                          충분
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleRemove(m.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <ProductSearchDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        orderId={orderId}
        existingProductIds={materials.map((m) => m.product_id).filter((id): id is string => id !== null)}
        onAdded={loadMaterials}
      />
    </Card>
  );
}

// 품목 검색 + 추가 다이얼로그
function ProductSearchDialog({
  open,
  onOpenChange,
  orderId,
  existingProductIds,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  existingProductIds: string[];
  onAdded: () => void;
}) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<
    Array<{ id: string; name: string; category: string; sku: string | null; unit: string | null }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<{
    id: string;
    name: string;
    unit: string | null;
  } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }
    setIsSearching(true);
    const result = await getProducts({ search: query, isActive: true, limit: 20 });
    if (result.data) {
      setProducts(result.data as Array<{ id: string; name: string; category: string; sku: string | null; unit: string | null }>);
    }
    setIsSearching(false);
  }, []);

  // 디바운스 검색
  useEffect(() => {
    const timer = setTimeout(() => handleSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search, handleSearch]);

  // 다이얼로그 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setSearch('');
      setProducts([]);
      setSelected(null);
      setQuantity(1);
    }
  }, [open]);

  const handleAdd = async () => {
    if (!selected) return;

    setIsAdding(true);
    const result = await addOrderMaterial({
      order_id: orderId,
      product_id: selected.id,
      planned_quantity: quantity,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`${selected.name} 추가됨`);
      onAdded();
      onOpenChange(false);
    }
    setIsAdding(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>자재 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="품목명 또는 SKU로 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* 검색 결과 */}
          {isSearching ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : products.length > 0 ? (
            <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
              {products.map((p) => {
                const isExisting = existingProductIds.includes(p.id);
                const isSelected = selected?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isExisting}
                    onClick={() => setSelected({ id: p.id, name: p.name, unit: p.unit })}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      isExisting
                        ? 'opacity-50 cursor-not-allowed bg-muted'
                        : isSelected
                          ? 'bg-primary/10'
                          : 'hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {PRODUCT_CATEGORY_LABELS[p.category as keyof typeof PRODUCT_CATEGORY_LABELS] || p.category}
                      </span>
                    </div>
                    {p.sku && (
                      <div className="text-xs text-muted-foreground">{p.sku}</div>
                    )}
                    {isExisting && (
                      <span className="text-xs text-muted-foreground">이미 추가됨</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : search.trim() ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              검색 결과가 없습니다
            </div>
          ) : null}

          {/* 선택된 품목 + 수량 */}
          {selected && (
            <div className="border rounded-md p-3 bg-accent/30 space-y-3">
              <div className="text-sm font-medium">
                선택: {selected.name}
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="quantity" className="shrink-0">수량</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-24"
                />
                {selected.unit && (
                  <span className="text-sm text-muted-foreground">{selected.unit}</span>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleAdd} disabled={!selected || isAdding}>
            {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
