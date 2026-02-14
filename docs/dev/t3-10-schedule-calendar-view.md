# T3.10 스케줄 월간 캘린더 뷰 구현 완료

**완료일:** 2026-02-14
**담당:** Sisyphus-Junior (executor)

## 완료 항목

### 1. 날짜 유틸리티 함수 생성
- **파일:** `src/lib/utils/date.ts`
- **기능:**
  - `getCalendarDays()`: 월간 그리드용 날짜 배열 생성 (이전/다음 달 포함)
  - `isSameDay()`, `isToday()`, `isSameMonth()`: 날짜 비교
  - `toISODate()`, `fromISODate()`: ISO 날짜 문자열 변환
  - `getMonthRange()`: 월의 첫날/마지막날 반환
  - `formatMonthYear()`: 한국어 월 포맷팅
  - `WEEKDAY_LABELS`: 한국어 요일 약자

### 2. 월간 캘린더 뷰 컴포넌트
- **파일:** `src/components/schedule/schedule-calendar-view.tsx`
- **기능:**
  - 7열 x 5~6행 월간 그리드 레이아웃
  - 이전/다음 달 네비게이션
  - "오늘" 버튼으로 현재 달로 이동
  - 오늘 날짜 하이라이트 (ring-2 ring-primary)
  - 각 날짜 셀에 일정 표시:
    - 최대 3개까지 칩 형태로 표시
    - 초과 시 "+N" 카운터 표시
    - 모바일: 도트(•)만 표시
    - 데스크탑: 제목 일부 표시
  - 날짜 클릭 시 우측/하단에 해당 날짜 일정 목록 표시
  - 일정 유형별 색상 구분 (SCHEDULE_TYPE_COLORS)
  - 일요일(빨강), 토요일(파랑) 색상 구분
  - 현재 월 외 날짜는 opacity 낮춤

### 3. 뷰 전환 컨테이너
- **파일:** `src/components/schedule/schedule-view-container.tsx`
- **기능:**
  - ViewSwitcher를 통한 calendar/agenda 뷰 전환
  - 기본 뷰: 데스크탑/태블릿 calendar, 모바일 agenda
  - localStorage에 뷰 설정 저장
  - 월 변경 시 URL 파라미터 업데이트 (`?month=2026-02`)
  - agenda 뷰는 placeholder (T3.12에서 구현 예정)

### 4. 스케줄 페이지 (Server Component)
- **파일:** `src/app/(dashboard)/schedule/page.tsx`
- **기능:**
  - searchParams에서 `month` 파라미터 읽기
  - 기본값: 현재 달
  - 해당 월의 첫날~마지막날로 `getSchedules()` 호출
  - 에러 처리
  - "신규 일정 등록" 버튼 (링크: `/schedule/new`)
  - ScheduleViewContainer에 데이터 전달

## 주요 결정사항

### 1. 자체 캘린더 구현 선택
- `@schedule-x` 라이브러리 대신 커스텀 구현
- 이유: 복잡성 감소, 요구사항에 맞는 최소한의 기능, 커스터마이징 용이
- 결과: 더 가벼운 번들 사이즈, 명확한 제어

### 2. 일정 도트/칩 표시 방식
- 각 날짜 셀에 최대 3개까지 표시
- 반응형: 모바일에서는 도트만, 데스크탑에서는 제목 포함
- 일정 유형별 색상으로 한눈에 구분 가능

### 3. 선택된 날짜 일정 상세 표시
- 캘린더 우측 (lg 이상) 또는 하단 (모바일)에 패널 표시
- 날짜 클릭 시 해당 날짜의 모든 일정을 상세 카드로 표시
- 완료 상태, 시간, 위치, 수주 정보 포함

### 4. URL 기반 월 네비게이션
- `?month=YYYY-MM` 파라미터로 월 관리
- 브라우저 뒤로가기/북마크 지원
- Server Component에서 데이터 사전 로드

## 빌드 및 테스트 결과

### 빌드 성공
```
✓ Compiled successfully
✓ Generating static pages (13/13)
Route /schedule: 4.67 kB (221 kB First Load JS)
```

### TypeScript 검사
- 모든 파일 LSP 진단 통과
- 타입 에러 0개

### 기능 검증 항목
- [x] 월간 그리드 정상 렌더링
- [x] 이전/다음 달 네비게이션 동작
- [x] 오늘 날짜 하이라이트
- [x] 일정 데이터 날짜별 그룹화
- [x] 일정 칩/도트 표시
- [x] 날짜 클릭 시 상세 패널 표시
- [x] ViewSwitcher 정상 동작
- [x] 반응형 레이아웃

## 알려진 이슈

### 1. agenda 뷰 미구현
- **상태:** T3.12에서 구현 예정
- **현재:** placeholder 메시지 표시
- **영향:** 사용자가 agenda 뷰 선택 시 구현 예정 안내 표시

### 2. 일정 클릭 액션 없음
- **상태:** 현재 읽기 전용 뷰
- **개선 가능:** 일정 클릭 시 상세 페이지 이동 또는 편집 모달
- **우선순위:** 낮음 (MVP 범위 외)

## 다음 단계

### T3.12: 스케줄 아젠다 뷰 구현
- 시간순 리스트 뷰
- 날짜별 그룹화
- 체크박스로 완료 토글
- 시간 충돌 경고 표시

### 추후 개선 가능 항목
1. 드래그 앤 드롭으로 일정 날짜 변경
2. 월간 뷰에서 일정 생성 (날짜 더블클릭)
3. 주간 뷰 추가
4. 캘린더 인쇄 기능
5. iCal/Google Calendar 연동

## 파일 목록

**생성된 파일:**
- `src/lib/utils/date.ts`
- `src/components/schedule/schedule-calendar-view.tsx`
- `src/components/schedule/schedule-view-container.tsx`
- `src/app/(dashboard)/schedule/page.tsx`

**수정된 파일:**
- `src/components/schedule/schedule-agenda-view.tsx` (타입 에러 수정)

**문서:**
- `docs/dev/t3-10-schedule-calendar-view.md`
