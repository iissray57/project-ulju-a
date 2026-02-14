'use client';

import Link from 'next/link';
import { Plus, List, Clock } from 'lucide-react';
import { useViewState } from '@/hooks/use-view-state';
import { ViewSwitcher } from '@/components/common/view-switcher';
import { PurchaseOrderList } from './purchase-order-list';
import { PurchaseOrderTimeline } from './purchase-order-timeline';
import type { ViewConfig, ViewType } from '@/lib/types/views';
import type { Database } from '@/lib/database.types';

type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row'];

const PURCHASE_VIEWS: ViewConfig[] = [
  {
    type: 'list',
    label: '목록',
    icon: List,
    defaultForBreakpoint: { mobile: true, tablet: true, desktop: true },
  },
  {
    type: 'timeline',
    label: '타임라인',
    icon: Clock,
    defaultForBreakpoint: {},
  },
];

const AVAILABLE_VIEWS: ViewType[] = ['list', 'timeline'];

interface PurchasesViewContainerProps {
  orders: PurchaseOrder[];
  total: number;
}

export function PurchasesViewContainer({
  orders,
  total,
}: PurchasesViewContainerProps) {
  const { view, setView } = useViewState({
    storageKey: 'purchases-view',
    defaultView: {
      mobile: 'list',
      tablet: 'list',
      desktop: 'list',
    },
    availableViews: AVAILABLE_VIEWS,
  });

  return (
    <div className="space-y-4">
      {/* View Switcher */}
      <div className="flex items-center justify-between">
        <ViewSwitcher
          views={PURCHASE_VIEWS}
          currentView={view}
          onViewChange={setView}
        />
      </div>

      {/* View Content */}
      {view === 'list' && <PurchaseOrderList orders={orders} total={total} />}
      {view === 'timeline' && <PurchaseOrderTimeline orders={orders} />}

      {/* Mobile FAB */}
      <Link
        href="/purchases/new"
        className="md:hidden fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="발주 등록"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
