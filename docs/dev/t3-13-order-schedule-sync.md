# T3.13 수주-스케줄 단방향 연동

**날짜**: 2026-02-14
**태스크**: T3.13 수주-스케줄 단방향 연동
**상태**: ✅ 완료

## 완료 항목

### 1. 핵심 구현 파일

#### `/src/lib/utils/order-schedule-sync.ts` (신규)
- 수주 상태 변경 시 스케줄 자동 생성 로직
- 연동 규칙:
  - `measurement_done` 전이 → `measurement` 스케줄 자동 생성 (실측일 기준)
  - `date_fixed` 전이 → `installation` 스케줄 자동 생성 (설치일 기준)
- 중복 방지: 동일 order_id + type + is_active=true 스케줄이 이미 존재하면 생성 안 함

#### `/src/app/(dashboard)/orders/actions.ts` (수정)
- `transitionOrderStatus` 함수에 `syncOrderSchedule` 호출 추가
- 상태 전이 성공 후 자동으로 관련 스케줄 생성
- `/schedule` 경로에 대한 `revalidatePath` 추가

#### `/src/components/orders/order-schedules.tsx` (신규)
- 수주 상세 페이지에 관련 일정 표시 컴포넌트
- Server Component로 구현
- 스케줄 타입별 Badge, 날짜/시간, 위치, 완료 상태 표시
- 빈 상태: "등록된 일정이 없습니다" 메시지

#### `/src/app/(dashboard)/orders/[id]/page.tsx` (수정)
- `OrderSchedules` 컴포넌트 추가하여 수주 상세 하단에 관련 일정 표시

### 2. 빌드 검증
```bash
npm run build
```
- ✅ 빌드 성공 (에러 0개)
- ✅ TypeScript strict 타입 검사 통과
- ✅ LSP diagnostics 깨끗함

## 주요 결정사항

### 1. 단방향 연동 (Order → Schedule)
- 수주 상태 변경이 스케줄을 자동 생성하는 단방향 흐름
- 스케줄 변경은 수주에 영향 없음 (양방향 연동은 향후 고려)

### 2. 중복 방지 로직
- `maybeSingle()` 사용: 스케줄이 없으면 null 반환, 1개면 데이터 반환
- 동일 order_id + type + is_active=true 조건으로 중복 체크
- 기존 스케줄이 있으면 새로 생성하지 않음

### 3. Server Component 기반 일정 표시
- `OrderSchedules`는 Server Component로 구현
- 실시간성보다는 페이지 로드 시 최신 데이터 표시 우선
- 필요 시 클라이언트 컴포넌트로 전환 가능 (낙관적 업데이트 등)

### 4. 에러 핸들링
- 스케줄 생성 실패 시 console.error로 로깅만 하고 트랜잭션 중단하지 않음
- 수주 상태 전이가 주 목적이므로 스케줄 생성은 부가 기능으로 처리

## 알려진 이슈

없음

## 다음 단계

- 수주 상태 전이 시 스케줄이 정상적으로 자동 생성되는지 QA 테스트 필요
- 스케줄 페이지에서 수주와 연결된 일정을 확인할 수 있는지 검증
- 필요시 스케줄에서 수주로의 역방향 링크 추가 고려

## 파일 요약

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/lib/utils/order-schedule-sync.ts` | 신규 | 수주-스케줄 자동 연동 로직 |
| `src/app/(dashboard)/orders/actions.ts` | 수정 | transitionOrderStatus에 스케줄 자동 생성 통합 |
| `src/components/orders/order-schedules.tsx` | 신규 | 수주 상세 내 일정 목록 컴포넌트 |
| `src/app/(dashboard)/orders/[id]/page.tsx` | 수정 | OrderSchedules 컴포넌트 통합 |
