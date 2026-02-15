'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  SCHEDULE_TYPE_LABELS,
  SCHEDULE_TYPE_COLORS,
  type ScheduleType,
} from '@/lib/schemas/schedule';
import type { ScheduleWithOrder } from '@/app/(dashboard)/schedule/actions';
import { toggleScheduleCompleted } from '@/app/(dashboard)/schedule/actions';
import { detectConflicts, getConflictInfo } from '@/lib/utils/schedule-conflict';
import { toast } from 'sonner';
import { MapPin, Clock, AlertTriangle } from 'lucide-react';

interface ScheduleAgendaViewProps {
  schedules: ScheduleWithOrder[];
}

// 날짜별 그룹화 (시간순 ASC)
function groupByDate(schedules: ScheduleWithOrder[]): Map<string, ScheduleWithOrder[]> {
  const grouped = new Map<string, ScheduleWithOrder[]>();

  for (const schedule of schedules) {
    const dateKey = schedule.scheduled_date;
    const existing = grouped.get(dateKey) || [];
    grouped.set(dateKey, [...existing, schedule]);
  }

  // 각 그룹 내 정렬은 이미 actions.ts의 getSchedules에서 수행됨
  // (scheduled_date ASC, scheduled_time ASC)

  return grouped;
}

// 날짜 헤더 포맷
function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 오늘인지 확인 (YYYY-MM-DD 비교)
  const dateOnly = dateStr.split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (dateOnly === todayStr) {
    return `오늘 · ${date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' })}`;
  }

  if (dateOnly === tomorrowStr) {
    return `내일 · ${date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' })}`;
  }

  // 일반: "2월 15일 (토)"
  return date.toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  });
}

export function ScheduleAgendaView({ schedules }: ScheduleAgendaViewProps) {
  const [optimisticCompleted, setOptimisticCompleted] = useState<Map<string, boolean>>(
    new Map()
  );

  const grouped = groupByDate(schedules);
  const conflictMap = detectConflicts(schedules);

  // 체크박스 토글 핸들러
  const handleToggle = async (scheduleId: string, currentCompleted: boolean) => {
    // Optimistic update
    setOptimisticCompleted((prev) => new Map(prev).set(scheduleId, !currentCompleted));

    const result = await toggleScheduleCompleted(scheduleId);

    if (result.error) {
      toast.error(result.error);
      // Revert optimistic update
      setOptimisticCompleted((prev) => {
        const next = new Map(prev);
        next.delete(scheduleId);
        return next;
      });
    } else {
      toast.success(currentCompleted ? '완료 취소됨' : '완료됨');
    }
  };

  if (schedules.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        표시할 일정이 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([date, daySchedules]) => (
        <div key={date}>
          {/* 날짜 헤더 */}
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            {formatDateHeader(date)}
          </h3>

          {/* 일정 리스트 */}
          <div className="space-y-3">
            {daySchedules.map((schedule) => {
              const status = schedule.type as ScheduleType;
              const isCompleted: boolean =
                optimisticCompleted.get(schedule.id) ?? schedule.is_completed ?? false;
              const conflicts = getConflictInfo(schedule.id, conflictMap, schedules);
              const hasConflict = conflicts.length > 0;

              return (
                <Card
                  key={schedule.id}
                  className={`p-4 ${isCompleted ? 'opacity-60' : ''} ${hasConflict ? 'border-amber-500 dark:border-amber-600' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* 체크박스 */}
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() =>
                        handleToggle(schedule.id, schedule.is_completed ?? false)
                      }
                      className="mt-1"
                    />

                    {/* 내용 */}
                    <div className="flex-1 space-y-2">
                      {/* 타이틀 행 */}
                      <div className="flex items-start gap-2 flex-wrap">
                        {/* 시간 */}
                        {schedule.scheduled_time && (
                          <span className="font-semibold text-base flex items-center gap-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {schedule.scheduled_time}
                          </span>
                        )}

                        {/* 유형 Badge */}
                        <Badge className={SCHEDULE_TYPE_COLORS[status]}>
                          {SCHEDULE_TYPE_LABELS[status]}
                        </Badge>

                        {/* 제목 */}
                        <span
                          className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {schedule.title}
                        </span>
                      </div>

                      {/* 주문 정보 */}
                      {schedule.order && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-mono">
                            {schedule.order.order_number}
                          </span>
                        </div>
                      )}

                      {/* 위치 + 시간 */}
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {schedule.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {schedule.location}
                          </span>
                        )}
                        {schedule.duration_minutes && (
                          <span>{schedule.duration_minutes}분</span>
                        )}
                      </div>

                      {/* 충돌 경고 */}
                      {hasConflict && !isCompleted && (
                        <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-900">
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <p className="font-medium">시간 충돌</p>
                            {conflicts.map((c) => (
                              <p key={c.id} className="text-xs">
                                {c.scheduled_time} {SCHEDULE_TYPE_LABELS[c.type as ScheduleType]}{' '}
                                · {c.title}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
