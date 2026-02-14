'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TRANSACTION_TYPE_LABELS,
  type TransactionType,
} from '@/lib/schemas/inventory';
import type { InventoryTransactionWithProduct } from '@/app/(dashboard)/inventory/actions';

interface InventoryHistoryTimelineProps {
  transactions: InventoryTransactionWithProduct[];
}

// 날짜별 그룹화 (최신순)
function groupByDate(
  transactions: InventoryTransactionWithProduct[]
): Map<string, InventoryTransactionWithProduct[]> {
  const grouped = new Map<string, InventoryTransactionWithProduct[]>();

  for (const transaction of transactions) {
    if (!transaction.created_at) continue;
    const dateKey = transaction.created_at.split('T')[0]; // YYYY-MM-DD
    const existing = grouped.get(dateKey) || [];
    grouped.set(dateKey, [...existing, transaction]);
  }

  // Map을 배열로 변환 후 날짜 내림차순 정렬
  const sortedEntries = Array.from(grouped.entries()).sort((a, b) =>
    b[0].localeCompare(a[0])
  );

  return new Map(sortedEntries);
}

// 날짜 포맷: "2024년 2월 14일 (금)"
function formatDateHeader(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

// 타입별 Badge 색상
function getTransactionTypeBadge(type: TransactionType) {
  const label = TRANSACTION_TYPE_LABELS[type];

  switch (type) {
    case 'inbound':
      return (
        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
          {label}
        </Badge>
      );
    case 'outbound':
      return (
        <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400">
          {label}
        </Badge>
      );
    case 'hold':
      return (
        <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
          {label}
        </Badge>
      );
    case 'release_hold':
      return (
        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
          {label}
        </Badge>
      );
    case 'adjustment':
      return (
        <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400">
          {label}
        </Badge>
      );
    default:
      return <Badge variant="secondary">{label}</Badge>;
  }
}

export function InventoryHistoryTimeline({
  transactions,
}: InventoryHistoryTimelineProps) {
  const grouped = groupByDate(transactions);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        재고 변동 이력이 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([date, dayTransactions]) => (
        <div key={date}>
          {/* 날짜 헤더 */}
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            {formatDateHeader(date)}
          </h3>

          {/* 타임라인 노드 */}
          <div className="relative border-l-2 border-muted pl-6 space-y-4">
            {dayTransactions.map((transaction) => {
              const quantityChange =
                transaction.quantity >= 0
                  ? `+${transaction.quantity}`
                  : `${transaction.quantity}`;

              return (
                <div key={transaction.id} className="relative">
                  {/* 타임라인 도트 */}
                  <div className="absolute -left-[calc(1.5rem+5px)] top-2 w-3 h-3 rounded-full bg-primary" />

                  {/* 이력 카드 */}
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        {/* 유형 + 제품명 */}
                        <div className="flex items-center gap-2">
                          {getTransactionTypeBadge(
                            transaction.type as TransactionType
                          )}
                          <span className="font-semibold">
                            {transaction.product?.name || '(제품 정보 없음)'}
                          </span>
                        </div>

                        {/* 수량 변동 */}
                        <div className="text-sm text-muted-foreground">
                          <span className="font-mono">
                            {transaction.before_quantity} →{' '}
                            {transaction.after_quantity}
                          </span>
                          {' ('}
                          <span
                            className={
                              transaction.quantity >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }
                          >
                            {quantityChange}
                          </span>
                          {transaction.product?.unit && ` ${transaction.product.unit}`}
                          {')'}
                        </div>

                        {/* 메모 */}
                        {transaction.memo && (
                          <div className="text-sm text-muted-foreground italic">
                            {transaction.memo}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
