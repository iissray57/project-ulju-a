'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  type ProductCategory,
} from '@/lib/schemas/product';
import { deleteProduct } from '@/app/(dashboard)/products/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { Database } from '@/lib/database.types';

type ProductRow = Database['public']['Tables']['products']['Row'];

interface ProductListProps {
  products: ProductRow[];
  total: number;
}

export function ProductList({ products, total }: ProductListProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter logic
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query) ||
          p.memo?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, selectedCategory, searchQuery]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteProduct(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('품목이 삭제되었습니다.');
        router.refresh();
      }
    } catch {
      toast.error('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '-';
    return price.toLocaleString('ko-KR') + '원';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-3">
        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            전체
          </Button>
          {PRODUCT_CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {PRODUCT_CATEGORY_LABELS[category]}
            </Button>
          ))}
        </div>

        {/* Search */}
        <Input
          type="search"
          placeholder="품목명, SKU 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredProducts.length}개 품목 {total !== products.length && `(전체 ${total}개)`}
      </div>

      {/* Table */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          등록된 품목이 없습니다. 품목을 먼저 등록해주세요.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>카테고리</TableHead>
                <TableHead>품목명</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>단위</TableHead>
                <TableHead className="text-right">단가</TableHead>
                <TableHead className="text-right">최소재고</TableHead>
                <TableHead className="w-[100px]">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Badge variant="outline">
                      {PRODUCT_CATEGORY_LABELS[product.category as ProductCategory]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.sku || '-'}</TableCell>
                  <TableCell>{product.unit || 'EA'}</TableCell>
                  <TableCell className="text-right">{formatPrice(product.unit_price)}</TableCell>
                  <TableCell className="text-right">{product.min_stock || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/products/${product.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deletingId === product.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>품목 삭제</AlertDialogTitle>
                            <AlertDialogDescription>
                              &quot;{product.name}&quot; 품목을 삭제하시겠습니까?
                              <br />
                              삭제된 품목은 비활성 상태로 변경됩니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(product.id)}>
                              삭제
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
