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

  return <ProductList products={products} total={total} />;
}
