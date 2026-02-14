'use client';

import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MonthlyTrendData {
  period: string;
  total_amount: number;
  count: number;
}

interface FinanceSummaryViewProps {
  year: number;
  month: number;
  revenueSummary: number;
  costSummary: number;
  profit: number;
  profitMargin: number;
  monthlyRevenueTrend: MonthlyTrendData[];
  monthlyCostTrend: MonthlyTrendData[];
  onMonthChange: (year: number, month: number) => void;
}

export function FinanceSummaryView({
  year,
  month,
  revenueSummary,
  costSummary,
  profit,
  profitMargin,
  monthlyRevenueTrend,
  monthlyCostTrend,
  onMonthChange,
}: FinanceSummaryViewProps) {
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

  // 최근 6개월 데이터 준비
  const last6Months: Array<{ label: string; revenue: number; cost: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const targetMonth = month - i;
    const targetYear = targetMonth < 1 ? year - 1 : year;
    const adjustedMonth = targetMonth < 1 ? targetMonth + 12 : targetMonth;
    const periodKey = `${targetYear}-${String(adjustedMonth).padStart(2, '0')}`;

    const revenueItem = monthlyRevenueTrend.find((item) => item.period === periodKey);
    const costItem = monthlyCostTrend.find((item) => item.period === periodKey);

    last6Months.push({
      label: `${adjustedMonth}월`,
      revenue: revenueItem?.total_amount ?? 0,
      cost: costItem?.total_amount ?? 0,
    });
  }

  // 차트 높이 계산
  const maxValue = Math.max(
    ...last6Months.map((item) => Math.max(item.revenue, item.cost)),
    1
  );

  return (
    <div className="space-y-6">
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

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 매출 */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">매출</p>
              <p className="text-2xl font-bold mt-2">
                {revenueSummary.toLocaleString()}원
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        {/* 매입 */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">매입</p>
              <p className="text-2xl font-bold mt-2">
                {costSummary.toLocaleString()}원
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        {/* 손익 */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">손익</p>
              <p
                className={cn(
                  'text-2xl font-bold mt-2',
                  profit >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {profit >= 0 ? '+' : ''}
                {profit.toLocaleString()}원
              </p>
            </div>
          </div>
        </Card>

        {/* 이익률 */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">이익률</p>
              <p
                className={cn(
                  'text-2xl font-bold mt-2',
                  profitMargin >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 월별 추이 차트 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">최근 6개월 추이</h3>
        <div className="space-y-6">
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

          {/* 차트 */}
          <div className="flex items-end justify-between gap-2 h-48">
            {last6Months.map((item, index) => {
              const revenueHeight = (item.revenue / maxValue) * 100;
              const costHeight = (item.cost / maxValue) * 100;

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  {/* 바 차트 */}
                  <div className="w-full flex items-end justify-center gap-1 h-40">
                    {/* 매출 바 */}
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all hover:opacity-80"
                      style={{ height: `${revenueHeight}%` }}
                      title={`매출: ${item.revenue.toLocaleString()}원`}
                    />
                    {/* 매입 바 */}
                    <div
                      className="w-full bg-red-500 rounded-t transition-all hover:opacity-80"
                      style={{ height: `${costHeight}%` }}
                      title={`매입: ${item.cost.toLocaleString()}원`}
                    />
                  </div>
                  {/* 레이블 */}
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
