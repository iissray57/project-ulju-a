'use client';

import Link from 'next/link';
import { Plus, Kanban, List, Clock } from 'lucide-react';
import { useViewState } from '@/hooks/use-view-state';
import { ViewSwitcher } from '@/components/common/view-switcher';
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
}

export function OrdersViewContainer({
  orders,
  total,
}: OrdersViewContainerProps) {
  const { view, setView } = useViewState({
    storageKey: 'orders-view',
    defaultView: {
      mobile: 'list',
      tablet: 'list',
      desktop: 'kanban',
    },
    availableViews: AVAILABLE_VIEWS,
  });

  return (
    <div className="space-y-4">
      {/* View Switcher */}
      <div className="flex items-center justify-between">
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
