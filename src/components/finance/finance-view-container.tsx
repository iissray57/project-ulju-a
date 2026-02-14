'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, List, Calendar } from 'lucide-react';
import { ViewSwitcher } from '@/components/common/view-switcher';
import { useViewState } from '@/hooks/use-view-state';
import { FinanceSummaryView } from './finance-summary-view';
import { FinanceListView } from './finance-list-view';
import { FinanceCalendarView } from './finance-calendar-view';
import type { Database } from '@/lib/database.types';

type RevenueRow = Database['public']['Tables']['revenue_records']['Row'];
type CostRow = Database['public']['Tables']['cost_records']['Row'];

interface MonthlyTrendData {
  period: string;
  total_amount: number;
  count: number;
}

interface FinanceViewContainerProps {
  year: number;
  month: number;
  revenueSummary: number;
  costSummary: number;
  profit: number;
  profitMargin: number;
  monthlyRevenueTrend: MonthlyTrendData[];
  monthlyCostTrend: MonthlyTrendData[];
  revenueRecords: RevenueRow[];
  costRecords: CostRow[];
}

export function FinanceViewContainer({
  year,
  month,
  revenueSummary,
  costSummary,
  profit,
  profitMargin,
  monthlyRevenueTrend,
  monthlyCostTrend,
  revenueRecords,
  costRecords,
}: FinanceViewContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { view, setView } = useViewState({
    storageKey: 'finance-view',
    defaultView: {
      mobile: 'summary',
      tablet: 'summary',
      desktop: 'summary',
    },
    availableViews: ['summary', 'list', 'calendar'],
  });

  const handleMonthChange = (newYear: number, newMonth: number) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('year', String(newYear));
    params.set('month', String(newMonth));
    router.push(`/finance?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <ViewSwitcher
        currentView={view}
        onViewChange={setView}
        views={[
          {
            type: 'summary',
            label: '요약',
            icon: LayoutGrid,
            defaultForBreakpoint: { mobile: true, tablet: true, desktop: true },
          },
          {
            type: 'list',
            label: '리스트',
            icon: List,
            defaultForBreakpoint: {},
          },
          {
            type: 'calendar',
            label: '캘린더',
            icon: Calendar,
            defaultForBreakpoint: {},
          },
        ]}
      />

      {view === 'summary' && (
        <FinanceSummaryView
          year={year}
          month={month}
          revenueSummary={revenueSummary}
          costSummary={costSummary}
          profit={profit}
          profitMargin={profitMargin}
          monthlyRevenueTrend={monthlyRevenueTrend}
          monthlyCostTrend={monthlyCostTrend}
          onMonthChange={handleMonthChange}
        />
      )}

      {view === 'list' && (
        <FinanceListView
          year={year}
          month={month}
          revenueRecords={revenueRecords}
          costRecords={costRecords}
          onMonthChange={handleMonthChange}
        />
      )}

      {view === 'calendar' && (
        <FinanceCalendarView
          year={year}
          month={month}
          revenueRecords={revenueRecords}
          costRecords={costRecords}
          onMonthChange={handleMonthChange}
        />
      )}
    </div>
  );
}
