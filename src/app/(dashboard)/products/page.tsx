import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProducts } from './actions';
import { ProductList } from '@/components/products/product-list';

export default async function ProductsPage() {
  const result = await getProducts({ isActive: true });

  if (result.error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">품목 관리</h1>
        </div>
        <div className="text-center py-12 text-destructive">{result.error}</div>
      </div>
    );
  }

  const products = result.data || [];
  const total = result.count || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">품목 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            재고 관리에 사용되는 품목(제품)을 등록하고 관리합니다
          </p>
        </div>
        <Link href="/products/new">
          <Button>
            <Plus className="h-4 w-4" />
            품목 등록
          </Button>
        </Link>
      </div>

      {/* Product List */}
      <ProductList products={products} total={total} />
    </div>
  );
}
