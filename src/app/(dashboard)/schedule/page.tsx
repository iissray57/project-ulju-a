import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScheduleViewContainer } from '@/components/schedule/schedule-view-container';
import { getSchedules } from './actions';
import { getMonthRange } from '@/lib/utils/date';

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function SchedulePage({ searchParams }: PageProps) {
  const params = await searchParams;

  // 월 파라미터 파싱 (기본: 현재 달)
  let year: number;
  let month: number;

  if (params.month) {
    const [y, m] = params.month.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
      year = y;
      month = m - 1; // 0-indexed
    } else {
      // Invalid format, use current month
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth();
    }
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth();
  }

  // 해당 월의 첫날~마지막날 계산
  const { start, end } = getMonthRange(year, month);

  // 스케줄 조회
  const result = await getSchedules({
    startDate: start,
    endDate: end,
    isActive: true,
  });

  if (result.error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">일정 관리</h1>
        </div>
        <div className="text-center py-12 text-destructive">{result.error}</div>
      </div>
    );
  }

  const schedules = result.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">일정 관리</h1>
          <p className="text-muted-foreground mt-2">
            {year}년 {month + 1}월 일정을 확인하세요
          </p>
        </div>
        <Button asChild>
          <Link href="/schedule/new">신규 일정 등록</Link>
        </Button>
      </div>

      <ScheduleViewContainer
        schedules={schedules}
        initialYear={year}
        initialMonth={month}
      />
    </div>
  );
}
