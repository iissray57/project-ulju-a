'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/database.types';

type RevenueRow = Database['public']['Tables']['revenue_records']['Row'];
type CostRow = Database['public']['Tables']['cost_records']['Row'];

type TabType = 'all' | 'revenue' | 'cost';

interface FinanceListViewProps {
  year: number;
  month: number;
  revenueRecords: RevenueRow[];
  costRecords: CostRow[];
  onMonthChange: (year: number, month: number) => void;
}

interface FinanceRecord {
  id: string;
  type: 'revenue' | 'cost';
  date: string;
  amount: number;
  relatedId: string | null;
  memo: string | null;
  paymentMethod: string | null;
}

export function FinanceListView({
  year,
  month,
  revenueRecords,
  costRecords,
  onMonthChange,
}: FinanceListViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const handlePrevMonth = () => {
    const newMonth = month - 1;
    if (newMonth < 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, newMonth);
    }
  };

  const handleNextMonth = () => {
    const newMonth = month + 1;
    if (newMonth > 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, newMonth);
    }
  };

  // 통합 레코드 생성
  const allRecords: FinanceRecord[] = [
    ...revenueRecords.map((record) => ({
      id: record.id,
      type: 'revenue' as const,
      date: record.confirmed_at || record.created_at || '',
      amount: record.confirmed_amount,
      relatedId: record.order_id,
      memo: record.memo,
      paymentMethod: record.payment_method,
    })),
    ...costRecords.map((record) => ({
      id: record.id,
      type: 'cost' as const,
      date: record.confirmed_at || record.created_at || '',
      amount: record.confirmed_amount,
      relatedId: record.purchase_order_id || record.order_id,
      memo: record.memo,
      paymentMethod: record.payment_method,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 필터링된 레코드
  const filteredRecords =
    activeTab === 'all'
      ? allRecords
      : allRecords.filter((record) => record.type === activeTab);

  return (
    <div className="space-y-4">
      {/* 기간 선택 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {year}년 {month}월
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveTab('all')}
        >
          전체
        </Button>
        <Button
          variant={activeTab === 'revenue' ? 'default' : 'outline'}
          onClick={() => setActiveTab('revenue')}
        >
          매출
        </Button>
        <Button
          variant={activeTab === 'cost' ? 'default' : 'outline'}
          onClick={() => setActiveTab('cost')}
        >
          매입
        </Button>
      </div>

      {/* 테이블 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-semibold">날짜</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">구분</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">금액</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">결제 방법</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">메모</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    해당 기간에 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      {new Date(record.date).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          record.type === 'revenue'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        )}
                      >
                        {record.type === 'revenue' ? '매출' : '매입'}
                      </span>
                    </td>
                    <td
                      className={cn(
                        'px-4 py-3 text-sm font-medium',
                        record.type === 'revenue'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {record.type === 'revenue' ? '+' : '-'}
                      {record.amount.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {record.paymentMethod || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[200px]">
                      {record.memo || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
