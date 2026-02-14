'use client';

import { useState, useMemo } from 'react';
import { Grid3x3, List } from 'lucide-react';
import { useViewState } from '@/hooks/use-view-state';
import { ViewSwitcher } from '@/components/common/view-switcher';
import { InventoryGridView } from './inventory-grid-view';
import { InventoryListView } from './inventory-list-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ViewConfig, ViewType } from '@/lib/types/views';
import type { InventoryWithProduct } from '@/app/(dashboard)/inventory/actions';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  type ProductCategory,
} from '@/lib/schemas/product';

const INVENTORY_VIEWS: ViewConfig[] = [
  {
    type: 'grid',
    label: '그리드',
    icon: Grid3x3,
    defaultForBreakpoint: { desktop: true },
  },
  {
    type: 'list',
    label: '목록',
    icon: List,
    defaultForBreakpoint: { mobile: true, tablet: true },
  },
];

const AVAILABLE_VIEWS: ViewType[] = ['grid', 'list'];

interface InventoryViewContainerProps {
  items: InventoryWithProduct[];
  total: number;
}

export function InventoryViewContainer({
  items,
  total,
}: InventoryViewContainerProps) {
  const { view, setView } = useViewState({
    storageKey: 'inventory-view',
    defaultView: {
      mobile: 'list',
      tablet: 'list',
      desktop: 'grid',
    },
    availableViews: AVAILABLE_VIEWS,
  });

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Filter logic
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(
        (item) => item.product?.category === selectedCategory
      );
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.product?.name.toLowerCase().includes(query) ||
          item.product?.sku.toLowerCase().includes(query)
      );
    }

    // Low stock filter
    if (lowStockOnly) {
      filtered = filtered.filter((item) => {
        const availableQty = item.quantity - item.held_quantity;
        const minStock = item.product?.min_stock || 0;
        return availableQty < minStock;
      });
    }

    return filtered;
  }, [items, selectedCategory, searchQuery, lowStockOnly]);

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

        {/* Search and low stock toggle */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Input
            type="search"
            placeholder="제품명, SKU 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex items-center gap-2">
            <Button
              variant={lowStockOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLowStockOnly(!lowStockOnly)}
            >
              부족 재고만
            </Button>
            <ViewSwitcher
              views={INVENTORY_VIEWS}
              currentView={view}
              onViewChange={setView}
            />
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredItems.length}개 항목 {total !== items.length && `(전체 ${total}개)`}
      </div>

      {/* View Content */}
      {view === 'grid' && <InventoryGridView items={filteredItems} />}
      {view === 'list' && <InventoryListView items={filteredItems} />}
    </div>
  );
}
