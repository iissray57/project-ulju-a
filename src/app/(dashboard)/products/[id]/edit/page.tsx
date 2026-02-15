import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductForm } from '@/components/products/product-form';
import { getProduct } from '../../actions';
import type { ProductCategory } from '@/lib/schemas/product';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getProduct(id);

  if (result.error || !result.data) {
    notFound();
  }

  const product = result.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">품목 수정</h1>
          <p className="text-muted-foreground mt-2">{product.name}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/products">목록으로</Link>
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>품목 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            productId={product.id}
            defaultValues={{
              name: product.name,
              category: product.category as ProductCategory,
              sku: product.sku || '',
              unit: product.unit || 'EA',
              unit_price: product.unit_price || 0,
              min_stock: product.min_stock || 0,
              memo: product.memo || '',
              is_active: product.is_active ?? true,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
