'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  SCHEDULE_TYPE_COLORS,
  type ScheduleType,
} from '@/lib/schemas/schedule';
import type { ScheduleWithOrder } from '@/app/(dashboard)/schedule/actions';
import { toISODate } from '@/lib/utils/date';

interface ScheduleWeeklyViewProps {
  schedules: ScheduleWithOrder[];
  currentDate?: Date;
  onWeekChange?: (date: Date) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 ~ 20:00
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

// 주의 시작일(일요일) 계산
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

// 주의 7일 배열 생성
function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

// 시간 문자열을 분으로 변환 (HH:mm -> minutes)
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// 분을 시간 문자열로 변환
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface ScheduleBlock {
  schedule: ScheduleWithOrder;
  startMinutes: number;
  endMinutes: number;
}

export function ScheduleWeeklyView({
  schedules,
  currentDate = new Date(),
  onWeekChange,
}: ScheduleWeeklyViewProps) {
  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  // 날짜별 일정 그룹화
  const schedulesByDate = useMemo(() => {
    const map = new Map<string, ScheduleBlock[]>();

    for (const schedule of schedules) {
      const dateKey = schedule.scheduled_date;

      // 시간이 있는 일정만 타임라인에 표시
      if (schedule.scheduled_time) {
        const startMinutes = timeToMinutes(schedule.scheduled_time);
        const endMinutes = startMinutes + (schedule.duration_minutes ?? 60);

        const existing = map.get(dateKey) || [];
        existing.push({ schedule, startMinutes, endMinutes });
        map.set(dateKey, existing);
      }
    }

    return map;
  }, [schedules]);

  // 날짜별 종일 일정 (시간 없음)
  const allDaySchedules = useMemo(() => {
    const map = new Map<string, ScheduleWithOrder[]>();

    for (const schedule of schedules) {
      if (!schedule.scheduled_time) {
        const dateKey = schedule.scheduled_date;
        const existing = map.get(dateKey) || [];
        existing.push(schedule);
        map.set(dateKey, existing);
      }
    }

    return map;
  }, [schedules]);

  const handlePrevWeek = () => {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    onWeekChange?.(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    onWeekChange?.(next);
  };

  // 현재 시간 표시선 (오늘인 경우)
  const currentTimeMinutes = useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);

  const today = toISODate(new Date());

  return (
    <div className="space-y-4">
      {/* 주 네비게이션 */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">
          {weekDays[0].toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} ~{' '}
          {weekDays[6].toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 주간 타임라인 그리드 */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* 헤더 - 요일 */}
            <div className="grid grid-cols-8 border-b border-border bg-muted/50">
              <div className="p-2 text-center text-sm font-medium border-r border-border">
                시간
              </div>
              {weekDays.map((day, i) => {
                const dateStr = toISODate(day);
                const isToday = dateStr === today;

                return (
                  <div
                    key={i}
                    className={`p-2 text-center border-r border-border last:border-r-0 ${
                      isToday ? 'bg-primary/10 font-semibold' : ''
                    }`}
                  >
                    <div className="text-sm">{WEEKDAYS[i]}</div>
                    <div className="text-xs text-muted-foreground">
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 종일 일정 행 */}
            <div className="grid grid-cols-8 border-b border-border bg-muted/30">
              <div className="p-2 text-center text-xs font-medium border-r border-border">
                종일
              </div>
              {weekDays.map((day, i) => {
                const dateStr = toISODate(day);
                const allDay = allDaySchedules.get(dateStr) || [];

                return (
                  <div
                    key={i}
                    className="p-1 border-r border-border last:border-r-0 min-h-[40px]"
                  >
                    {allDay.map((schedule) => (
                      <Badge
                        key={schedule.id}
                        className={`${SCHEDULE_TYPE_COLORS[schedule.type as ScheduleType]} text-xs mb-1 block truncate`}
                      >
                        {schedule.title}
                      </Badge>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* 시간대 행 */}
            {HOURS.map((hour) => {
              const hourStartMinutes = hour * 60;
              const hourEndMinutes = hourStartMinutes + 60;

              return (
                <div
                  key={hour}
                  className="grid grid-cols-8 border-b border-border hover:bg-muted/30 transition-colors relative"
                >
                  {/* 시간 라벨 */}
                  <div className="p-2 text-center text-sm font-medium border-r border-border">
                    {String(hour).padStart(2, '0')}:00
                  </div>

                  {/* 각 날짜 셀 */}
                  {weekDays.map((day, i) => {
                    const dateStr = toISODate(day);
                    const isToday = dateStr === today;
                    const blocks = schedulesByDate.get(dateStr) || [];

                    // 이 시간대에 겹치는 일정들
                    const overlapping = blocks.filter(
                      (block) =>
                        block.startMinutes < hourEndMinutes &&
                        block.endMinutes > hourStartMinutes
                    );

                    return (
                      <div
                        key={i}
                        className={`p-1 border-r border-border last:border-r-0 min-h-[60px] relative ${
                          isToday ? 'bg-primary/5' : ''
                        }`}
                      >
                        {overlapping.map((block) => {
                          // 이 셀 내에서의 시작/끝 위치 계산 (비율)

                          // 블록이 이 시간대의 시작인지 확인
                          const isBlockStart =
                            block.startMinutes >= hourStartMinutes &&
                            block.startMinutes < hourEndMinutes;

                          // 시작 시간대에만 표시 (중복 방지)
                          if (!isBlockStart) return null;

                          // 전체 블록 높이 계산 (여러 시간대에 걸칠 수 있음)
                          const totalDuration =
                            block.endMinutes - block.startMinutes;
                          const heightPercent = (totalDuration / 60) * 100;

                          return (
                            <div
                              key={block.schedule.id}
                              className={`absolute left-1 right-1 p-1 rounded text-xs overflow-hidden ${
                                SCHEDULE_TYPE_COLORS[
                                  block.schedule.type as ScheduleType
                                ]
                              }`}
                              style={{
                                top: `${((block.startMinutes - hourStartMinutes) / 60) * 100}%`,
                                height: `${Math.min(heightPercent, 100)}%`,
                                minHeight: '24px',
                              }}
                            >
                              <div className="font-medium truncate">
                                {minutesToTime(block.startMinutes)}
                              </div>
                              <div className="truncate">
                                {block.schedule.title}
                              </div>
                            </div>
                          );
                        })}

                        {/* 현재 시간 표시선 */}
                        {isToday &&
                          currentTimeMinutes >= hourStartMinutes &&
                          currentTimeMinutes < hourEndMinutes && (
                            <div
                              className="absolute left-0 right-0 border-t-2 border-red-500"
                              style={{
                                top: `${((currentTimeMinutes - hourStartMinutes) / 60) * 100}%`,
                              }}
                            />
                          )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
