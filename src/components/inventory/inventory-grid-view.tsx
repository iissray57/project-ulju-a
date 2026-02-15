'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/schemas/product';
import type { InventoryWithProduct } from '@/app/(dashboard)/inventory/actions';
import { cn } from '@/lib/utils';
import { AdjustInventoryDialog } from './adjust-inventory-dialog';

interface InventoryGridViewProps {
  items: InventoryWithProduct[];
}

export function InventoryGridView({ items }: InventoryGridViewProps) {
  const [adjustDialog, setAdjustDialog] = useState<{
    open: boolean;
    productId: string;
    productName: string;
    currentQuantity: number;
    heldQuantity: number;
  } | null>(null);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        재고가 없습니다
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
          const product = item.product;
          if (!product) return null;

          const availableQty = item.quantity - item.held_quantity;
          const isLowStock = availableQty < product.min_stock;
          const isCritical = availableQty < product.min_stock * 0.5;

          return (
            <Card key={item.id} className="p-4 space-y-3">
            {/* Product info */}
            <div className="space-y-1">
              <h3 className="font-semibold line-clamp-2">{product.name}</h3>
              {product.category && (
                <p className="text-xs text-muted-foreground">
                  {PRODUCT_CATEGORY_LABELS[product.category as keyof typeof PRODUCT_CATEGORY_LABELS]}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t" />

            {/* Stock info */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">재고</span>
                <span className="font-medium">{item.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">hold</span>
                <span className="font-medium">{item.held_quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">가용</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{availableQty}</span>
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
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">최소</span>
                <span className="font-medium">{product.min_stock}</span>
              </div>
            </div>

            {/* SKU & Actions */}
            <div className="pt-2 border-t space-y-2">
              {product.sku && (
                <p className="text-xs text-muted-foreground">
                  SKU: {product.sku}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  setAdjustDialog({
                    open: true,
                    productId: product.id,
                    productName: product.name,
                    currentQuantity: item.quantity,
                    heldQuantity: item.held_quantity,
                  })
                }
              >
                <Settings2 className="h-4 w-4" />
                재고 조정
              </Button>
            </div>
          </Card>
        );
      })}
    </div>

    {/* Adjust Dialog */}
    {adjustDialog && (
      <AdjustInventoryDialog
        open={adjustDialog.open}
        onOpenChange={(open) => !open && setAdjustDialog(null)}
        productId={adjustDialog.productId}
        productName={adjustDialog.productName}
        currentQuantity={adjustDialog.currentQuantity}
        heldQuantity={adjustDialog.heldQuantity}
        onSuccess={() => setAdjustDialog(null)}
      />
    )}
  </>
  );
}
