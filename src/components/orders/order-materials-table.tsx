import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getOrderMaterials } from '@/app/(dashboard)/orders/material-actions';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/schemas/product';

interface OrderMaterialsTableProps {
  orderId: string;
}

export async function OrderMaterialsTable({ orderId }: OrderMaterialsTableProps) {
  const result = await getOrderMaterials(orderId);

  if (result.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>자재 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive text-sm">{result.error}</div>
        </CardContent>
      </Card>
    );
  }

  const materials = result.data || [];

  if (materials.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>자재 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm text-center py-8">
            등록된 자재가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>자재 현황</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>품목명</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead className="text-right">계획 수량</TableHead>
              <TableHead className="text-right">hold 수량</TableHead>
              <TableHead className="text-right">부족 수량</TableHead>
              <TableHead className="text-center">상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((material) => {
              const hasShortage = material.shortage_quantity > 0;

              return (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">
                    {material.product?.name || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {material.product?.category
                      ? PRODUCT_CATEGORY_LABELS[
                          material.product.category as keyof typeof PRODUCT_CATEGORY_LABELS
                        ] || material.product.category
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {material.planned_quantity}
                    {material.product?.unit && (
                      <span className="text-muted-foreground ml-1">
                        {material.product.unit}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {material.held_quantity}
                    {material.product?.unit && (
                      <span className="text-muted-foreground ml-1">
                        {material.product.unit}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {material.shortage_quantity}
                    {material.product?.unit && (
                      <span className="text-muted-foreground ml-1">
                        {material.product.unit}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {hasShortage ? (
                      <Badge variant="destructive">부족</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400">
                        충분
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
