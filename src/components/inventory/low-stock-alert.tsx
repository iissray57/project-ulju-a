import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLowStockItems } from '@/app/(dashboard)/inventory/actions';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/schemas/product';

export async function LowStockAlert() {
  const result = await getLowStockItems();

  if (result.error) {
    return null; // 에러 발생 시 숨기기
  }

  const items = result.data || [];

  if (items.length === 0) {
    return null; // 부족 재고 없으면 숨기기
  }

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-destructive">⚠️</span>
          부족 재고 알림
          <Badge variant="destructive" className="ml-auto">
            {items.length}건
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const availableQty = item.quantity - item.held_quantity;
            const minStock = item.product?.min_stock || 0;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background border"
              >
                <div className="space-y-1">
                  <div className="font-medium">
                    {item.product?.name || '(제품 정보 없음)'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.product?.category
                      ? PRODUCT_CATEGORY_LABELS[
                          item.product.category as keyof typeof PRODUCT_CATEGORY_LABELS
                        ] || item.product.category
                      : '-'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono">
                    <span className="text-destructive font-semibold">
                      {availableQty}
                    </span>
                    {' / '}
                    <span className="text-muted-foreground">{minStock}</span>
                    {item.product?.unit && (
                      <span className="text-muted-foreground ml-1">
                        {item.product.unit}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    가용 / 최소재고
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
