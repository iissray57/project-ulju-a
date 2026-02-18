'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useCurtainModeler } from './curtain-context';
import { getProducts } from '@/app/(dashboard)/products/actions';
import type { Database } from '@/lib/database.types';

type ProductRow = Database['public']['Tables']['products']['Row'];

const formatPrice = (price: number | null) => {
  if (!price) return '-';
  return price.toLocaleString('ko-KR') + '원';
};

function ProductList({
  label,
  products,
  loading,
  selectedId,
  onSelect,
}: {
  label: string;
  products: ProductRow[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (product: ProductRow | null) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  const selectedProduct = products.find((p) => p.id === selectedId);

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground">{label}</h4>

      <Input
        type="search"
        placeholder="제품명 검색..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-7 text-xs"
      />

      <ScrollArea className="h-32">
        {loading ? (
          <p className="text-xs text-muted-foreground p-2">로딩 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground p-2">등록된 제품이 없습니다</p>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((product) => {
              const isSelected = selectedId === product.id;
              return (
                <button
                  key={product.id}
                  type="button"
                  className={cn(
                    'w-full text-left rounded-md px-2 py-1 text-xs transition-colors',
                    isSelected
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => onSelect(isSelected ? null : product)}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn('font-medium', isSelected && 'text-primary')}>
                      {product.name}
                    </span>
                    <span className="text-muted-foreground">{formatPrice(product.unit_price)}</span>
                  </div>
                  {product.sku && (
                    <span className="text-[10px] text-muted-foreground">{product.sku}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {selectedProduct && (
        <Badge variant="secondary" className="text-xs">
          {selectedProduct.name} ({formatPrice(selectedProduct.unit_price)})
        </Badge>
      )}
    </div>
  );
}

export function ProductPicker() {
  const { state, setConfig } = useCurtainModeler();
  const { config } = state;
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  const category = config.productType === 'curtain' ? 'curtain' : 'blind';

  useEffect(() => {
    setLoading(true);
    getProducts({ category: category as 'curtain' | 'blind', isActive: true, limit: 100 }).then(
      (result) => {
        setProducts(result.data || []);
        setLoading(false);
      }
    );
  }, [category]);

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">제품 선택</h3>

      {/* 겉커튼 (또는 블라인드) 제품 */}
      <ProductList
        label={config.productType === 'curtain' ? (config.doubleCurtain ? '겉커튼 제품' : '커튼 제품') : '블라인드 제품'}
        products={products}
        loading={loading}
        selectedId={config.selectedProductId}
        onSelect={(product) =>
          setConfig({
            selectedProductId: product?.id ?? null,
            selectedProductName: product?.name ?? null,
            selectedProductPrice: product?.unit_price ?? null,
          })
        }
      />

      {/* 속커튼 제품 (2중 커튼일 때만) */}
      {config.productType === 'curtain' && config.doubleCurtain && (
        <>
          <Separator />
          <ProductList
            label="속커튼 제품"
            products={products}
            loading={loading}
            selectedId={config.innerProductId}
            onSelect={(product) =>
              setConfig({
                innerProductId: product?.id ?? null,
                innerProductName: product?.name ?? null,
                innerProductPrice: product?.unit_price ?? null,
              })
            }
          />
        </>
      )}
    </div>
  );
}
