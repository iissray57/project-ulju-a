'use client';

import { Badge } from '@/components/ui/badge';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/schemas/product';
import type { InventoryWithProduct } from '@/app/(dashboard)/inventory/actions';
import { cn } from '@/lib/utils';

interface InventoryListViewProps {
  items: InventoryWithProduct[];
}

export function InventoryListView({ items }: InventoryListViewProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        재고가 없습니다
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">제품명</th>
              <th className="px-4 py-3 text-left text-sm font-medium">카테고리</th>
              <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
              <th className="px-4 py-3 text-right text-sm font-medium">재고</th>
              <th className="px-4 py-3 text-right text-sm font-medium">hold</th>
              <th className="px-4 py-3 text-right text-sm font-medium">가용</th>
              <th className="px-4 py-3 text-right text-sm font-medium">최소</th>
              <th className="px-4 py-3 text-center text-sm font-medium">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => {
              const product = item.product;
              if (!product) return null;

              const availableQty = item.quantity - item.held_quantity;
              const isLowStock = availableQty < product.min_stock;
              const isCritical = availableQty < product.min_stock * 0.5;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {product.category
                      ? PRODUCT_CATEGORY_LABELS[product.category as keyof typeof PRODUCT_CATEGORY_LABELS]
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {product.sku || '-'}
                  </td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">{item.held_quantity}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {availableQty}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {product.min_stock}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      {isCritical ? (
                        <Badge variant="destructive" className="text-xs">
                          부족
                        </Badge>
                      ) : isLowStock ? (
                        <Badge
                          className={cn(
                            'bg-orange-500 text-white dark:bg-orange-600',
                            '[a&]:hover:bg-orange-600 dark:[a&]:hover:bg-orange-700'
                          )}
                        >
                          주의
                        </Badge>
                      ) : (
                        <Badge
                          className={cn(
                            'bg-green-500 text-white dark:bg-green-600',
                            '[a&]:hover:bg-green-600 dark:[a&]:hover:bg-green-700'
                          )}
                        >
                          정상
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden divide-y">
        {items.map((item) => {
          const product = item.product;
          if (!product) return null;

          const availableQty = item.quantity - item.held_quantity;
          const isLowStock = availableQty < product.min_stock;
          const isCritical = availableQty < product.min_stock * 0.5;

          return (
            <div key={item.id} className="p-4 space-y-3">
              {/* Product info */}
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{product.name}</h3>
                  {isCritical ? (
                    <Badge variant="destructive" className="text-xs shrink-0">
                      부족
                    </Badge>
                  ) : isLowStock ? (
                    <Badge
                      className={cn(
                        'bg-orange-500 text-white dark:bg-orange-600 shrink-0',
                        '[a&]:hover:bg-orange-600 dark:[a&]:hover:bg-orange-700'
                      )}
                    >
                      주의
                    </Badge>
                  ) : (
                    <Badge
                      className={cn(
                        'bg-green-500 text-white dark:bg-green-600 shrink-0',
                        '[a&]:hover:bg-green-600 dark:[a&]:hover:bg-green-700'
                      )}
                    >
                      정상
                    </Badge>
                  )}
                </div>
                {product.category && (
                  <p className="text-xs text-muted-foreground">
                    {PRODUCT_CATEGORY_LABELS[product.category as keyof typeof PRODUCT_CATEGORY_LABELS]}
                  </p>
                )}
                {product.sku && (
                  <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                )}
              </div>

              {/* Stock info grid */}
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">재고</p>
                  <p className="font-medium">{item.quantity}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">hold</p>
                  <p className="font-medium">{item.held_quantity}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">가용</p>
                  <p className="font-medium">{availableQty}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">최소</p>
                  <p className="font-medium">{product.min_stock}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
