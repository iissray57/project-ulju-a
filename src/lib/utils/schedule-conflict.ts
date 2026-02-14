import type { ScheduleWithOrder } from '@/app/(dashboard)/schedule/actions';

/**
 * 일정 충돌 감지 유틸
 * 같은 날짜에 시간이 겹치는 일정들을 찾아 반환
 */

// 시간 파싱 (HH:mm -> minutes since midnight)
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// 두 일정의 시간 충돌 여부 확인
function hasTimeOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  // A의 시작이 B의 끝보다 이전 AND B의 시작이 A의 끝보다 이전
  return startA < endB && startB < endA;
}

/**
 * 일정 충돌 감지
 * @param schedules - 검사할 일정 배열
 * @returns Map<scheduleId, conflictingScheduleIds[]>
 */
export function detectConflicts(
  schedules: ScheduleWithOrder[]
): Map<string, string[]> {
  const conflictMap = new Map<string, string[]>();

  // 활성화된 일정만 검사
  const activeSchedules = schedules.filter((s) => s.is_active && !s.is_completed);

  // 날짜별 그룹화
  const schedulesByDate = new Map<string, ScheduleWithOrder[]>();

  for (const schedule of activeSchedules) {
    // 시간이 없는 일정은 충돌 검사 제외
    if (!schedule.scheduled_time) continue;

    const dateKey = schedule.scheduled_date;
    const existing = schedulesByDate.get(dateKey) || [];
    schedulesByDate.set(dateKey, [...existing, schedule]);
  }

  // 같은 날짜의 일정들끼리 비교
  for (const [, daySchedules] of schedulesByDate) {
    for (let i = 0; i < daySchedules.length; i++) {
      const scheduleA = daySchedules[i];
      const startA = parseTimeToMinutes(scheduleA.scheduled_time!);
      const durationA = scheduleA.duration_minutes ?? 60; // 기본 60분
      const endA = startA + durationA;

      for (let j = i + 1; j < daySchedules.length; j++) {
        const scheduleB = daySchedules[j];
        const startB = parseTimeToMinutes(scheduleB.scheduled_time!);
        const durationB = scheduleB.duration_minutes ?? 60;
        const endB = startB + durationB;

        // 충돌 검사
        if (hasTimeOverlap(startA, endA, startB, endB)) {
          // A의 충돌 목록에 B 추가
          const conflictsA = conflictMap.get(scheduleA.id) || [];
          conflictMap.set(scheduleA.id, [...conflictsA, scheduleB.id]);

          // B의 충돌 목록에 A 추가
          const conflictsB = conflictMap.get(scheduleB.id) || [];
          conflictMap.set(scheduleB.id, [...conflictsB, scheduleA.id]);
        }
      }
    }
  }

  return conflictMap;
}

/**
 * 특정 일정의 충돌 정보 가져오기
 */
export function getConflictInfo(
  scheduleId: string,
  conflictMap: Map<string, string[]>,
  schedules: ScheduleWithOrder[]
): ScheduleWithOrder[] {
  const conflictingIds = conflictMap.get(scheduleId) || [];

  return schedules.filter((s) => conflictingIds.includes(s.id));
}
