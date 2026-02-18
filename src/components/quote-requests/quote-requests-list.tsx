'use client';

import { useState } from 'react';
import type { Database } from '@/lib/database.types';
import { QuoteRequestDetailDialog } from './quote-request-detail-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type QuoteRequestRow = Database['public']['Tables']['quote_requests']['Row'];

const STATUS_LABELS: Record<string, string> = {
  pending: '대기',
  contacted: '연락완료',
  quoted: '견적발송',
  completed: '완료',
  cancelled: '취소',
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  quoted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const CATEGORY_LABELS: Record<string, string> = {
  angle: '앵글 옷장',
  curtain: '커튼',
  system: '시스템 수납',
  blind: '블라인드',
};

interface QuoteRequestsListProps {
  initialData: QuoteRequestRow[];
  total: number;
}

export function QuoteRequestsList({ initialData, total }: QuoteRequestsListProps) {
  const [items, setItems] = useState<QuoteRequestRow[]>(initialData);
  const [selected, setSelected] = useState<QuoteRequestRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRowClick = (item: QuoteRequestRow) => {
    setSelected(item);
    setDialogOpen(true);
  };

  const handleUpdated = (updated: QuoteRequestRow) => {
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setSelected(updated);
  };

  const handleDeleted = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        견적요청이 없습니다.
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground mb-3">총 {total}건</p>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">고객명</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">연락처</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">카테고리</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">상태</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">요청일</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => handleRowClick(item)}
              >
                <td className="px-4 py-3 font-medium">{item.customer_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.customer_phone}</td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <Badge variant="outline" className="text-xs">
                    {CATEGORY_LABELS[item.category] || item.category}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[item.status] || ''}`}
                  >
                    {STATUS_LABELS[item.status] || item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                  {new Date(item.created_at).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRowClick(item)}
                  >
                    상세
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <QuoteRequestDetailDialog
          quoteRequest={selected}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}
