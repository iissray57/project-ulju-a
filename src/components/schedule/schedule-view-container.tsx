'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, List } from 'lucide-react';
import { ViewSwitcher } from '@/components/common/view-switcher';
import { useViewState } from '@/hooks/use-view-state';
import { ScheduleCalendarView } from './schedule-calendar-view';
import type { ScheduleWithOrder } from '@/app/(dashboard)/schedule/actions';
import type { ViewConfig } from '@/lib/types/views';

interface ScheduleViewContainerProps {
  schedules: ScheduleWithOrder[];
  initialYear: number;
  initialMonth: number;
}

const SCHEDULE_VIEWS: ViewConfig[] = [
  {
    type: 'calendar',
    label: '캘린더',
    icon: Calendar,
    defaultForBreakpoint: {
      desktop: true,
      tablet: true,
      mobile: false,
    },
  },
  {
    type: 'agenda',
    label: '목록',
    icon: List,
    defaultForBreakpoint: {
      desktop: false,
      tablet: false,
      mobile: true,
    },
  },
];

export function ScheduleViewContainer({
  schedules,
  initialYear,
  initialMonth,
}: ScheduleViewContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { view, setView } = useViewState({
    storageKey: 'schedule-view',
    defaultView: {
      mobile: 'agenda',
      tablet: 'calendar',
      desktop: 'calendar',
    },
    availableViews: ['calendar', 'agenda'],
  });

  const handleMonthChange = (year: number, month: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', `${year}-${String(month + 1).padStart(2, '0')}`);
    router.push(`/schedule?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* View Switcher */}
      <div className="flex justify-end">
        <ViewSwitcher
          views={SCHEDULE_VIEWS}
          currentView={view}
          onViewChange={setView}
        />
      </div>

      {/* View Content */}
      {view === 'calendar' && (
        <ScheduleCalendarView
          schedules={schedules}
          initialYear={initialYear}
          initialMonth={initialMonth}
          onMonthChange={handleMonthChange}
        />
      )}

      {view === 'agenda' && (
        <div className="p-8 text-center border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">
            목록 뷰는 T3.12에서 구현될 예정입니다.
          </p>
        </div>
      )}
    </div>
  );
}
