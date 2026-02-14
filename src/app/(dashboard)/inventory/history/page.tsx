import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getInventoryTransactions } from '../actions';
import { InventoryHistoryTimeline } from '@/components/inventory/inventory-history-timeline';

export default async function InventoryHistoryPage() {
  const result = await getInventoryTransactions({ limit: 100 });

  if (result.error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link
                  href="/inventory"
                  className="text-muted-foreground hover:text-foreground"
                >
                  ← 뒤로
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold">재고 변동 이력</h1>
          </div>
        </div>
        <Separator />
        <div className="text-destructive">{result.error}</div>
      </div>
    );
  }

  const transactions = result.data || [];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link
                href="/inventory"
                className="text-muted-foreground hover:text-foreground"
              >
                ← 뒤로
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">재고 변동 이력</h1>
          <p className="text-muted-foreground">
            총 {transactions.length}건의 이력
          </p>
        </div>
      </div>

      <Separator />

      {/* 타임라인 */}
      <InventoryHistoryTimeline transactions={transactions} />
    </div>
  );
}
