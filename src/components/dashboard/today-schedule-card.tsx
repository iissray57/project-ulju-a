import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSchedulesByDate } from '@/app/(dashboard)/schedule/actions';
import { SCHEDULE_TYPE_LABELS, SCHEDULE_TYPE_COLORS } from '@/lib/schemas/schedule';

function formatTime(time: string | null): string {
  if (!time) return '';
  // HH:mm format
  return time.slice(0, 5);
}

function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

export async function TodayScheduleCard() {
  const today = getTodayDate();
  const tomorrow = getTomorrowDate();

  const todayResult = await getSchedulesByDate(today);
  const tomorrowResult = await getSchedulesByDate(tomorrow);

  const todaySchedules = todayResult.data || [];
  const tomorrowSchedules = tomorrowResult.data || [];

  const hasSchedules = todaySchedules.length > 0 || tomorrowSchedules.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          오늘의 일정
        </CardTitle>
        <CardAction>
          <Link
            href="/schedule"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            더 보기
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {!hasSchedules && (
          <p className="text-sm text-muted-foreground py-4">오늘 일정이 없습니다</p>
        )}
        {hasSchedules && (
          <div className="space-y-4">
            {todaySchedules.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">오늘</h4>
                <div className="space-y-2">
                  {todaySchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-start gap-2 p-2 rounded-lg border"
                    >
                      <Badge
                        variant="outline"
                        className={SCHEDULE_TYPE_COLORS[schedule.type]}
                      >
                        {SCHEDULE_TYPE_LABELS[schedule.type]}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{schedule.title}</p>
                        {schedule.scheduled_time && (
                          <p className="text-xs text-muted-foreground">
                            {formatTime(schedule.scheduled_time)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tomorrowSchedules.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">내일</h4>
                <div className="space-y-2">
                  {tomorrowSchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-start gap-2 p-2 rounded-lg border"
                    >
                      <Badge
                        variant="outline"
                        className={SCHEDULE_TYPE_COLORS[schedule.type]}
                      >
                        {SCHEDULE_TYPE_LABELS[schedule.type]}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{schedule.title}</p>
                        {schedule.scheduled_time && (
                          <p className="text-xs text-muted-foreground">
                            {formatTime(schedule.scheduled_time)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
