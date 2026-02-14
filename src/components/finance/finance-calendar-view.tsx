'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getCalendarDays,
  isSameMonth,
  isToday,
  toISODate,
  WEEKDAY_LABELS,
} from '@/lib/utils/date';
import type { Database } from '@/lib/database.types';

type RevenueRow = Database['public']['Tables']['revenue_records']['Row'];
type CostRow = Database['public']['Tables']['cost_records']['Row'];

interface FinanceCalendarViewProps {
  year: number;
  month: number;
  revenueRecords: RevenueRow[];
  costRecords: CostRow[];
  onMonthChange: (year: number, month: number) => void;
}

interface DailySummary {
  revenue: number;
  cost: number;
  total: number;
}

export function FinanceCalendarView({
  year,
  month,
  revenueRecords,
  costRecords,
  onMonthChange,
}: FinanceCalendarViewProps) {
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

  // 날짜별 데이터 집계
  const dailySummaryMap = new Map<string, DailySummary>();

  revenueRecords.forEach((record) => {
    const dateKey = record.confirmed_at || record.created_at;
    if (!dateKey) return;

    const date = dateKey.split('T')[0];
    const existing = dailySummaryMap.get(date) ?? { revenue: 0, cost: 0, total: 0 };
    existing.revenue += record.confirmed_amount;
    existing.total += record.confirmed_amount;
    dailySummaryMap.set(date, existing);
  });

  costRecords.forEach((record) => {
    const dateKey = record.confirmed_at || record.created_at;
    if (!dateKey) return;

    const date = dateKey.split('T')[0];
    const existing = dailySummaryMap.get(date) ?? { revenue: 0, cost: 0, total: 0 };
    existing.cost += record.confirmed_amount;
    existing.total -= record.confirmed_amount;
    dailySummaryMap.set(date, existing);
  });

  const calendarDays = getCalendarDays(year, month - 1); // month is 1-based, getCalendarDays expects 0-based

  return (
    <div className="space-y-4">
      {/* 헤더 */}
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

      {/* 범례 */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span>매출</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span>매입</span>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={label}
            className={cn(
              'text-center text-sm font-semibold py-2',
              index === 0 ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground',
              index === 6 && 'text-blue-500 dark:text-blue-400'
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const dateKey = toISODate(date);
          const dailySummary = dailySummaryMap.get(dateKey);
          const isCurrentMonth = isSameMonth(date, year, month - 1);
          const isTodayDate = isToday(date);
          const isSunday = date.getDay() === 0;
          const isSaturday = date.getDay() === 6;

          return (
            <div
              key={`${dateKey}-${index}`}
              className={cn(
                'relative flex flex-col items-start p-3 min-h-[100px] rounded-md border transition-colors',
                isCurrentMonth
                  ? 'bg-card border-border'
                  : 'bg-muted/30 border-muted text-muted-foreground',
                isTodayDate && 'ring-2 ring-primary ring-offset-1'
              )}
            >
              {/* 날짜 숫자 */}
              <div
                className={cn(
                  'text-sm font-medium mb-2',
                  !isCurrentMonth && 'opacity-40',
                  isSunday && 'text-red-500 dark:text-red-400',
                  isSaturday && 'text-blue-500 dark:text-blue-400'
                )}
              >
                {date.getDate()}
              </div>

              {/* 금액 정보 */}
              {dailySummary && isCurrentMonth && (
                <div className="space-y-1 w-full">
                  {/* 매출 */}
                  {dailySummary.revenue > 0 && (
                    <div className="text-xs">
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        +{(dailySummary.revenue / 10000).toFixed(0)}만
                      </span>
                    </div>
                  )}

                  {/* 매입 */}
                  {dailySummary.cost > 0 && (
                    <div className="text-xs">
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        -{(dailySummary.cost / 10000).toFixed(0)}만
                      </span>
                    </div>
                  )}

                  {/* 일별 합계 */}
                  {(dailySummary.revenue > 0 || dailySummary.cost > 0) && (
                    <div className="text-xs pt-1 border-t">
                      <span
                        className={cn(
                          'font-semibold',
                          dailySummary.total >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {dailySummary.total >= 0 ? '+' : ''}
                        {(dailySummary.total / 10000).toFixed(0)}만
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
