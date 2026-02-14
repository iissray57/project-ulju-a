# T2.8 수주 타임라인 뷰 구현 완료

**작업일시**: 2026-02-14
**담당**: executor
**관련 태스크**: T2.8 (수주 타임라인 뷰)

## 완료 항목

### 1. 타임라인 뷰 컴포넌트 생성
- **파일**: `src/components/orders/order-timeline-view.tsx`
- **구조**:
  - 날짜별 그룹화 (최신순)
  - 타임라인 스타일 (세로 라인 + 도트 노드)
  - 수주 정보 카드 (수주번호, 고객명, 상태 Badge, 유형, 금액, 주요 일정)
  - 클릭 시 상세 페이지 이동
  - 빈 상태 처리

### 2. 주요 기능
- **날짜별 그룹화**: `created_at` 기준으로 날짜별 그룹화 후 최신순 정렬
- **날짜 헤더 포맷**: "2024년 2월 14일 (금)" 형식
- **금액 포맷**: "₩350만" 형식
- **주요 일정 표시**:
  - `measurement_done` 이상: `installation_date` 우선 ("설치: 2/20")
  - `confirmed` 이상: `measurement_date` 우선 ("실측: 2/15")
- **상태 Badge**: `ORDER_STATUS_COLORS`, `ORDER_STATUS_LABELS` 사용

### 3. 타입 안정성
- `created_at`이 nullable (`string | null`)이므로 null 체크 추가
- `OrderWithCustomer` 타입 import 및 사용
- `OrderStatus` 타입 캐스팅

### 4. 빌드 확인
- `npm run build` 성공 (타입 에러 0개)
- 모든 페이지 정상 빌드

## 주요 결정사항

### 1. 타임라인 도트 색상
- 단일 `bg-primary` 색상 사용 (상태별 색상 분리 안 함)
- 상태는 Badge로 명확히 구분

### 2. 주요 일정 우선순위
- 진행 단계에 따라 더 중요한 일정 표시
- `measurement_done` 이상: 설치일
- `confirmed` 이상: 실측일
- 그 외: 일정 표시 안 함

### 3. 금액 표시 우선순위
- `confirmed_amount` 우선
- 없으면 `quotation_amount`
- 둘 다 없으면 "(미정)"

## 코드 스니펫

```typescript
// 날짜별 그룹화
function groupByDate(orders: OrderWithCustomer[]): Map<string, OrderWithCustomer[]> {
  const grouped = new Map<string, OrderWithCustomer[]>();

  for (const order of orders) {
    if (!order.created_at) continue; // null 처리
    const dateKey = order.created_at.split('T')[0]; // YYYY-MM-DD
    const existing = grouped.get(dateKey) || [];
    grouped.set(dateKey, [...existing, order]);
  }

  // Map을 배열로 변환 후 날짜 내림차순 정렬
  const sortedEntries = Array.from(grouped.entries()).sort((a, b) =>
    b[0].localeCompare(a[0])
  );

  return new Map(sortedEntries);
}
```

```typescript
// 주요 일정 추출
function getPrimaryDate(order: OrderWithCustomer): string | null {
  const status = order.status as OrderStatus;

  if (
    ['measurement_done', 'date_fixed', 'material_held', 'installed'].includes(status) &&
    order.installation_date
  ) {
    return `설치: ${new Date(order.installation_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`;
  }

  if (['confirmed', 'measurement_done'].includes(status) && order.measurement_date) {
    return `실측: ${new Date(order.measurement_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`;
  }

  return null;
}
```

## 알려진 이슈

없음.

## 다음 단계

- T2.7에서 `orders-view-container.tsx`에 이 컴포넌트 통합
- 뷰 전환 버튼과 함께 리스트/타임라인 뷰 선택 기능 구현
