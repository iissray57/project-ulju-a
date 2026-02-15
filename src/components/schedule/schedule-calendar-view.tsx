'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getCalendarDays,
  isSameDay,
  isToday,
  isSameMonth,
  toISODate,
  formatMonthYear,
  WEEKDAY_LABELS,
} from '@/lib/utils/date';
import type { ScheduleWithOrder } from '@/app/(dashboard)/schedule/actions';
import { SCHEDULE_TYPE_LABELS, SCHEDULE_TYPE_COLORS } from '@/lib/schemas/schedule';

interface ScheduleCalendarViewProps {
  schedules: ScheduleWithOrder[];
  initialYear: number;
  initialMonth: number;
  onMonthChange: (year: number, month: number) => void;
}

export function ScheduleCalendarView({
  schedules,
  initialYear,
  initialMonth,
  onMonthChange,
}: ScheduleCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 날짜별 일정 맵 생성
  const schedulesByDate = new Map<string, ScheduleWithOrder[]>();
  schedules.forEach((schedule) => {
    const dateKey = schedule.scheduled_date;
    if (!schedulesByDate.has(dateKey)) {
      schedulesByDate.set(dateKey, []);
    }
    schedulesByDate.get(dateKey)!.push(schedule);
  });

  const calendarDays = getCalendarDays(initialYear, initialMonth);

  const handlePrevMonth = () => {
    const newMonth = initialMonth - 1;
    const newYear = newMonth < 0 ? initialYear - 1 : initialYear;
    const adjustedMonth = newMonth < 0 ? 11 : newMonth;
    onMonthChange(newYear, adjustedMonth);
  };

  const handleNextMonth = () => {
    const newMonth = initialMonth + 1;
    const newYear = newMonth > 11 ? initialYear + 1 : initialYear;
    const adjustedMonth = newMonth > 11 ? 0 : newMonth;
    onMonthChange(newYear, adjustedMonth);
  };

  const handleToday = () => {
    const now = new Date();
    onMonthChange(now.getFullYear(), now.getMonth());
    setSelectedDate(now);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const selectedDateSchedules = selectedDate
    ? schedulesByDate.get(toISODate(selectedDate)) || []
    : [];

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* 캘린더 그리드 */}
      <div className="flex-1">
        {/* 헤더 */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {formatMonthYear(initialYear, initialMonth)}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              오늘
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
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
            const daySchedules = schedulesByDate.get(dateKey) || [];
            const isCurrentMonth = isSameMonth(date, initialYear, initialMonth);
            const isTodayDate = isToday(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isSunday = date.getDay() === 0;
            const isSaturday = date.getDay() === 6;

            return (
              <button
                key={`${dateKey}-${index}`}
                onClick={() => handleDateClick(date)}
                className={cn(
                  'relative flex flex-col items-center justify-start p-2 min-h-[80px] sm:min-h-[100px] rounded-md border transition-colors',
                  'hover:bg-accent hover:border-accent-foreground/20',
                  isCurrentMonth
                    ? 'bg-card border-border'
                    : 'bg-muted/30 border-muted text-muted-foreground',
                  isTodayDate && 'ring-2 ring-primary ring-offset-1',
                  isSelected && 'bg-accent border-accent-foreground'
                )}
              >
                {/* 날짜 숫자 */}
                <div
                  className={cn(
                    'text-sm font-medium mb-1',
                    !isCurrentMonth && 'opacity-40',
                    isSunday && 'text-red-500 dark:text-red-400',
                    isSaturday && 'text-blue-500 dark:text-blue-400'
                  )}
                >
                  {date.getDate()}
                </div>

                {/* 일정 도트/칩 */}
                {daySchedules.length > 0 && (
                  <div className="flex flex-col gap-0.5 w-full">
                    {daySchedules.slice(0, 3).map((schedule) => {
                      const typeColor =
                        SCHEDULE_TYPE_COLORS[schedule.type as keyof typeof SCHEDULE_TYPE_COLORS];
                      return (
                        <div
                          key={schedule.id}
                          className={cn(
                            'text-[10px] px-1 py-0.5 rounded truncate',
                            typeColor
                          )}
                          title={schedule.title}
                        >
                          <span className="hidden sm:inline">{schedule.title}</span>
                          <span className="sm:hidden">•</span>
                        </div>
                      );
                    })}
                    {daySchedules.length > 3 && (
                      <div className="text-[10px] text-muted-foreground text-center">
                        +{daySchedules.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 날짜 일정 목록 */}
      {selectedDate && (
        <div className="w-full lg:w-80 border rounded-lg p-4 bg-card">
          <h3 className="font-semibold mb-4">
            {toISODate(selectedDate)} 일정
          </h3>
          {selectedDateSchedules.length === 0 ? (
            <p className="text-sm text-muted-foreground">일정이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {selectedDateSchedules.map((schedule) => {
                const typeColor =
                  SCHEDULE_TYPE_COLORS[schedule.type as keyof typeof SCHEDULE_TYPE_COLORS];
                const typeLabel =
                  SCHEDULE_TYPE_LABELS[schedule.type as keyof typeof SCHEDULE_TYPE_LABELS];

                return (
                  <div
                    key={schedule.id}
                    className="p-3 border rounded-md bg-card hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('text-xs px-2 py-0.5 rounded', typeColor)}>
                            {typeLabel}
                          </span>
                          {schedule.scheduled_time && (
                            <span className="text-xs text-muted-foreground">
                              {schedule.scheduled_time}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">{schedule.title}</p>
                        {schedule.location && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {schedule.location}
                          </p>
                        )}
                        {schedule.order && (
                          <p className="text-xs text-muted-foreground mt-1">
                            주문: {schedule.order.order_number}
                          </p>
                        )}
                      </div>
                      {schedule.is_completed && (
                        <span className="text-xs text-green-500 dark:text-green-400 shrink-0">
                          완료
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
