import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLowStockItems } from '@/app/(dashboard)/inventory/actions';

export async function InventoryAlertList() {
  const result = await getLowStockItems();
  const lowStockItems = result.data || [];

  const displayItems = lowStockItems.slice(0, 5);
  const hasMore = lowStockItems.length > 5;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          재고 경고
        </CardTitle>
        <CardAction>
          <Link
            href="/inventory?lowStock=true"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            더 보기
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {displayItems.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">부족한 재고가 없습니다</p>
        )}
        {displayItems.length > 0 && (
          <div className="space-y-2">
            {displayItems.map((item) => {
              const availableQty = item.quantity - item.held_quantity;
              const minStock = item.product?.min_stock || 0;
              const unit = item.product?.unit || '';

              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-2 p-2 rounded-lg border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product?.name}</p>
                    {item.product?.category && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {item.product.category}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                      {availableQty}
                      {unit}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      최소: {minStock}
                      {unit}
                    </p>
                  </div>
                </div>
              );
            })}
            {hasMore && (
              <Link
                href="/inventory?lowStock=true"
                className="block text-center text-sm text-muted-foreground hover:text-foreground pt-2 transition-colors"
              >
                +{lowStockItems.length - 5}개 더 보기
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
