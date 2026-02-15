'use client';

import { useState, useMemo } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_MAIN_CATEGORIES,
  PRODUCT_MAIN_CATEGORY_LABELS,
  MAIN_TO_CATEGORIES,
  CATEGORY_TO_MAIN,
  type ProductCategory,
  type ProductMainCategory,
  type ProductFormData,
} from '@/lib/schemas/product';
import { deleteProduct, getProduct } from '@/app/(dashboard)/products/actions';
import { ProductForm } from './product-form';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ExportButton } from '@/components/ui/export-button';
import type { ExportColumn } from '@/lib/utils/export';
import type { Database } from '@/lib/database.types';

type ProductRow = Database['public']['Tables']['products']['Row'];

interface ProductListProps {
  products: ProductRow[];
  total: number;
}

const PRODUCT_EXPORT_COLUMNS: ExportColumn<ProductRow>[] = [
  { header: '카테고리', accessor: (r) => PRODUCT_CATEGORY_LABELS[r.category as ProductCategory] },
  { header: '품목명', accessor: (r) => r.name },
  { header: 'SKU', accessor: (r) => r.sku },
  { header: '단위', accessor: (r) => r.unit || 'EA' },
  { header: '단가', accessor: (r) => r.unit_price },
  { header: '최소재고', accessor: (r) => r.min_stock },
];

export function ProductList({ products, total }: ProductListProps) {
  const router = useRouter();
  const [selectedMain, setSelectedMain] = useState<ProductMainCategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{ id: string; data: ProductFormData } | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Filter logic
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Main category filter
    if (selectedMain) {
      const subCategories = MAIN_TO_CATEGORIES[selectedMain];
      filtered = filtered.filter((p) => subCategories.includes(p.category as ProductCategory));
    }

    // Sub-category filter
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

  const handleOpenNew = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = async (product: ProductRow) => {
    setLoadingEdit(true);
    try {
      const result = await getProduct(product.id);
      if (result.error || !result.data) {
        toast.error(result.error || '품목을 불러올 수 없습니다.');
        return;
      }
      const p = result.data;
      setEditingProduct({
        id: p.id,
        data: {
          name: p.name,
          category: p.category as ProductCategory,
          sku: p.sku || '',
          unit: p.unit || 'EA',
          unit_price: p.unit_price || 0,
          min_stock: p.min_stock || 0,
          width: p.width ?? undefined,
          depth: p.depth ?? undefined,
          height: p.height ?? undefined,
          color: p.color || '',
          memo: p.memo || '',
          is_active: p.is_active ?? true,
        },
      });
      setDialogOpen(true);
    } catch {
      toast.error('품목 조회 중 오류가 발생했습니다.');
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingProduct(null);
  };

  const handleFormSuccess = () => {
    handleDialogClose();
    router.refresh();
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '-';
    return price.toLocaleString('ko-KR') + '원';
  };

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">품목 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            재고 관리에 사용되는 품목(제품)을 등록하고 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={filteredProducts} columns={PRODUCT_EXPORT_COLUMNS} filename="품목목록" sheetName="품목" />
          <Button onClick={handleOpenNew}>
            <Plus className="h-4 w-4" />
            품목 등록
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Main category chips */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedMain === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setSelectedMain(null); setSelectedCategory(null); }}
          >
            전체
          </Button>
          {PRODUCT_MAIN_CATEGORIES.map((main) => (
            <Button
              key={main}
              variant={selectedMain === main ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setSelectedMain(main); setSelectedCategory(null); }}
            >
              {PRODUCT_MAIN_CATEGORY_LABELS[main]}
            </Button>
          ))}
        </div>

        {/* Sub-category chips (대분류 선택 시) */}
        {selectedMain && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              전체
            </Button>
            {MAIN_TO_CATEGORIES[selectedMain].map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {PRODUCT_CATEGORY_LABELS[cat]}
              </Button>
            ))}
          </div>
        )}

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
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={loadingEdit}
                        onClick={() => handleOpenEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
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

      {/* Product Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) handleDialogClose(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              {editingProduct ? '품목 수정' : '품목 등록'}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-5rem)] px-6 pb-6">
            <ProductForm
              key={editingProduct?.id ?? 'new'}
              productId={editingProduct?.id}
              defaultValues={editingProduct?.data}
              onSuccess={handleFormSuccess}
              onCancel={handleDialogClose}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
