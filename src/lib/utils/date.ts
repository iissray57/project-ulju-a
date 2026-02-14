/**
 * 날짜 유틸리티 함수
 */

/**
 * 해당 월의 캘린더 그리드 날짜 배열 생성 (이전/다음 달 날짜 포함)
 * 항상 일요일부터 시작하는 7 x 5~6 그리드
 */
export function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // 첫 날의 요일 (0 = 일요일)
  const firstDayOfWeek = firstDay.getDay();

  // 마지막 날의 요일
  const lastDayOfWeek = lastDay.getDay();

  const days: Date[] = [];

  // 이전 달 날짜 채우기
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push(date);
  }

  // 현재 달 날짜
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  // 다음 달 날짜 채우기 (토요일까지)
  for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

/**
 * 두 날짜가 같은 날인지 비교
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * 오늘인지 확인
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * 같은 달인지 확인
 */
export function isSameMonth(date: Date, year: number, month: number): boolean {
  return date.getFullYear() === year && date.getMonth() === month;
}

/**
 * Date를 ISO 날짜 문자열로 변환 (YYYY-MM-DD)
 */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * ISO 날짜 문자열을 Date로 변환
 */
export function fromISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * 월의 첫날과 마지막날 반환
 */
export function getMonthRange(year: number, month: number): {
  start: string;
  end: string;
} {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return {
    start: toISODate(firstDay),
    end: toISODate(lastDay),
  };
}

/**
 * 한국어 요일 약자
 */
export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/**
 * 한국어 월 이름
 */
export function formatMonthYear(year: number, month: number): string {
  return `${year}년 ${month + 1}월`;
}
