# T3.12 스케줄 어젠다 뷰 + T3.14 일정 충돌 감지

## 완료 항목

### T3.12 스케줄 어젠다 뷰
- ✅ 크로놀로지컬 리스트 형태의 어젠다 뷰 구현
- ✅ 날짜별 그룹화 (오늘/내일 구분)
- ✅ 체크박스로 완료 상태 토글
- ✅ 완료된 항목 시각적 표시 (opacity, line-through)
- ✅ 유형별 Badge 표시
- ✅ 시간, 위치, 소요시간 정보 표시
- ✅ 수주 연결 정보 표시 (order_number)
- ✅ Optimistic UI 업데이트 (즉각적인 체크박스 반응)
- ✅ toast 알림 (완료/완료 취소)

### T3.14 일정 충돌 감지
- ✅ 같은 날짜 + 시간이 겹치는 일정 감지 로직
- ✅ 충돌 경고 표시 (amber border + warning badge)
- ✅ 충돌하는 일정 목록 표시
- ✅ 완료된 일정은 충돌 경고 숨김
- ✅ 시간이 없는 일정은 충돌 검사 제외

## 생성된 파일

### 1. `/src/lib/utils/schedule-conflict.ts`
일정 충돌 감지 유틸리티
- `detectConflicts()`: 전체 일정에서 충돌하는 일정들의 맵 생성
- `getConflictInfo()`: 특정 일정의 충돌 정보 조회
- 시간 파싱 및 겹침 판정 로직 (startA < endB && startB < endA)
- 완료된 일정 및 시간 없는 일정은 검사 제외

### 2. `/src/components/schedule/schedule-agenda-view.tsx`
어젠다 뷰 클라이언트 컴포넌트
- 날짜별 그룹화 (오늘/내일 자동 인식)
- 체크박스 + 완료 토글 + Optimistic UI
- 충돌 경고 배지 (AlertTriangle 아이콘)
- lucide-react 아이콘 사용 (Clock, MapPin, AlertTriangle)
- sonner toast 알림
- 완료된 항목 스타일링 (opacity-60, line-through)

### 3. `/src/components/ui/checkbox.tsx`
shadcn/ui checkbox 컴포넌트 설치 (`npx shadcn@latest add checkbox`)

## 주요 결정사항

### 1. 날짜 헤더 포맷
- 오늘: "오늘 · 2월 14일 (금)"
- 내일: "내일 · 2월 15일 (토)"
- 그 외: "2월 15일 (토)"

### 2. 충돌 감지 로직
```typescript
// 두 시간 구간이 겹치는지 판정
hasTimeOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}
```
- duration_minutes가 없는 경우 기본 60분으로 설정
- 완료된 일정(`is_completed: true`)은 충돌 검사에서 제외
- `scheduled_time`이 null인 일정은 충돌 검사 제외

### 3. Optimistic UI
- 체크박스 클릭 시 즉시 UI 업데이트 (Map 상태로 관리)
- Server Action 실패 시 자동 rollback
- toast로 성공/실패 피드백

### 4. 타입 안전성
- `is_completed`가 `boolean | null`이므로 `?? false`로 기본값 처리
- Checkbox의 `checked` prop은 boolean만 허용

## 알려진 이슈

없음. Build 성공, LSP 진단 clean.

## 다음 단계

- T3.13: 스케줄 캘린더 뷰 (react-big-calendar 등 고려)
- 스케줄 목록 페이지에서 어젠다 뷰 통합
- 모바일 반응형 테스트
