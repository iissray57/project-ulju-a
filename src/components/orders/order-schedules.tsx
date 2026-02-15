import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, CheckCircle2, Circle } from 'lucide-react';

interface OrderSchedulesProps {
  orderId: string;
}

// 스케줄 타입 라벨
function getScheduleTypeLabel(type: string) {
  switch (type) {
    case 'measurement':
      return '실측';
    case 'installation':
      return '설치';
    case 'visit':
      return '방문';
    case 'delivery':
      return '배송';
    case 'other':
      return '기타';
    default:
      return type;
  }
}

// 스케줄 타입 Badge variant
function getScheduleTypeBadgeVariant(type: string): 'default' | 'secondary' | 'outline' {
  switch (type) {
    case 'measurement':
      return 'default';
    case 'installation':
      return 'secondary';
    default:
      return 'outline';
  }
}

// 날짜 포맷
function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  } catch {
    return dateStr;
  }
}

// 시간 포맷
function formatTime(timeStr: string | null) {
  if (!timeStr) return null;
  try {
    return timeStr.slice(0, 5); // HH:MM
  } catch {
    return timeStr;
  }
}

export async function OrderSchedules({ orderId }: OrderSchedulesProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // 해당 주문의 활성 스케줄 조회
  const { data: schedules, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('order_id', orderId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('scheduled_date', { ascending: true });

  if (error) {
    console.error('[OrderSchedules] Failed to fetch schedules:', error);
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          관련 일정
        </CardTitle>
      </CardHeader>
      <CardContent>
        {schedules && schedules.length > 0 ? (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                {/* 완료 상태 아이콘 */}
                <div className="mt-0.5 shrink-0">
                  {schedule.is_completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* 스케줄 정보 */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getScheduleTypeBadgeVariant(schedule.type)}>
                      {getScheduleTypeLabel(schedule.type)}
                    </Badge>
                    <span className="font-medium truncate">{schedule.title}</span>
                  </div>

                  {/* 날짜 & 시간 */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>{formatDate(schedule.scheduled_date)}</span>
                    {schedule.scheduled_time && (
                      <>
                        <Clock className="ml-2 h-3.5 w-3.5 shrink-0" />
                        <span>{formatTime(schedule.scheduled_time)}</span>
                      </>
                    )}
                  </div>

                  {/* 장소 */}
                  {schedule.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="break-words">{schedule.location}</span>
                    </div>
                  )}

                  {/* 메모 */}
                  {schedule.memo && (
                    <p className="text-sm text-muted-foreground break-words">{schedule.memo}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">
            등록된 일정이 없습니다
          </p>
        )}
      </CardContent>
    </Card>
  );
}
