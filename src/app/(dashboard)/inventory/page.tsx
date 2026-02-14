import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getInventoryList } from './actions';
import { InventoryViewContainer } from '@/components/inventory/inventory-view-container';

export default async function InventoryPage() {
  const result = await getInventoryList();

  const items = result.data || [];
  const total = result.count || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">재고 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            제품 재고 현황 및 가용 수량 관리
          </p>
        </div>
        <Link href="/products/new">
          <Button>
            <Plus className="h-4 w-4" />
            제품 등록
          </Button>
        </Link>
      </div>

      {/* View Container (filters + view switcher + views) */}
      <InventoryViewContainer items={items} total={total} />
    </div>
  );
}
