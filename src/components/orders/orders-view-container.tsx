'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Kanban, List, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useViewState } from '@/hooks/use-view-state';
import { ViewSwitcher } from '@/components/common/view-switcher';
import { Button } from '@/components/ui/button';
import { OrderList } from './order-list';
import { OrderKanbanView } from './order-kanban-view';
import type { ViewConfig, ViewType } from '@/lib/types/views';
import type { OrderWithCustomer } from '@/app/(dashboard)/orders/actions';

const ORDER_VIEWS: ViewConfig[] = [
  {
    type: 'kanban',
    label: '칸반',
    icon: Kanban,
    defaultForBreakpoint: { desktop: true },
  },
  {
    type: 'list',
    label: '목록',
    icon: List,
    defaultForBreakpoint: { mobile: true, tablet: true },
  },
  {
    type: 'timeline',
    label: '타임라인',
    icon: Clock,
    defaultForBreakpoint: {},
  },
];

const AVAILABLE_VIEWS: ViewType[] = ['kanban', 'list', 'timeline'];

interface OrdersViewContainerProps {
  orders: OrderWithCustomer[];
  total: number;
  year: number;
  month: number;
}

export function OrdersViewContainer({
  orders,
  total,
  year,
  month,
}: OrdersViewContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { view, setView } = useViewState({
    storageKey: 'orders-view',
    defaultView: {
      mobile: 'list',
      tablet: 'list',
      desktop: 'kanban',
    },
    availableViews: AVAILABLE_VIEWS,
  });

  // 월 변경 핸들러
  const handleMonthChange = (direction: 'prev' | 'next') => {
    let newYear = year;
    let newMonth = month;

    if (direction === 'prev') {
      newMonth -= 1;
      if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }
    } else {
      newMonth += 1;
      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set('year', newYear.toString());
    params.set('month', newMonth.toString());
    router.push(`/orders?${params.toString()}`);
  };

  // 현재 월로 이동
  const handleGoToCurrentMonth = () => {
    const now = new Date();
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', now.getFullYear().toString());
    params.set('month', (now.getMonth() + 1).toString());
    router.push(`/orders?${params.toString()}`);
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth() + 1;
  };

  return (
    <div className="space-y-4">
      {/* 월 선택기 + View Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* 월 선택기 */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleMonthChange('prev')}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[120px] text-center font-medium">
            {year}년 {month}월
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleMonthChange('next')}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isCurrentMonth() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoToCurrentMonth}
              className="ml-2 text-muted-foreground"
            >
              이번 달
            </Button>
          )}
        </div>

        {/* View Switcher */}
        <ViewSwitcher
          views={ORDER_VIEWS}
          currentView={view}
          onViewChange={setView}
        />
      </div>

      {/* View Content */}
      {view === 'kanban' && <OrderKanbanView orders={orders} />}
      {view === 'list' && <OrderList orders={orders} total={total} />}
      {view === 'timeline' && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          타임라인 뷰는 준비 중입니다
        </div>
      )}

      {/* Mobile FAB */}
      <Link
        href="/orders/new"
        className="md:hidden fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="주문 등록"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
