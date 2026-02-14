# S2-T5: 발주 리스트/타임라인 뷰 + 등록/수정 폼

**날짜:** 2026-02-14
**작업자:** Sisyphus-Junior (executor)
**관련 태스크:** T5.2 발주 리스트/타임라인 뷰, T5.3 발주 등록/수정 폼

---

## 완료 항목

### T5.2: 발주 리스트/타임라인 뷰

1. **컴포넌트 구현**
   - `src/components/purchases/purchase-order-list.tsx` - 리스트 뷰 (Client Component)
   - `src/components/purchases/purchase-order-timeline.tsx` - 타임라인 뷰 (Client Component)
   - `src/components/purchases/purchases-view-container.tsx` - ViewSwitcher 통합 (Client Component)

2. **주요 기능**
   - 리스트 뷰: 발주번호, 거래처, 상태 Badge, 금액, 일자 표시
   - 타임라인 뷰: 날짜별 그룹화 (created_at 기준), 타임라인 도트 + 카드 레이아웃
   - 상태 필터 탭 (전체, draft, ordered, received, settled, cost_confirmed)
   - 검색 기능 (발주번호/거래처명)
   - ViewSwitcher (list/timeline)
   - 카드 클릭 시 상세 페이지 이동

3. **메인 페이지**
   - `src/app/(dashboard)/purchases/page.tsx` - Server Component
   - Tabs로 상태 필터 구현
   - 검색 폼 통합
   - Desktop: 헤더 "발주 등록" 버튼
   - Mobile: FAB (Floating Action Button)

### T5.3: 발주 등록/수정 폼 + 상세 페이지

1. **폼 컴포넌트**
   - `src/components/purchases/purchase-order-form.tsx` - 발주 등록/수정 폼 (Client Component)
   - react-hook-form + zod validation
   - 섹션: 거래처 정보, 금액, 결제 정보, 메모
   - 금액 포맷팅 (천 단위 구분)

2. **상태 관리 컴포넌트**
   - `src/components/purchases/purchase-order-status-bar.tsx` - 상태 전이 바 (Client Component)
   - 5단계 프로그레스: draft → ordered → received → settled → cost_confirmed
   - 정방향/역방향 전이 버튼 (PO_TRANSITIONS 규칙 준수)
   - 시각적 피드백: 체크마크(완료), 강조링(현재), 회색(미래)

3. **품목 관리 컴포넌트**
   - `src/components/purchases/purchase-order-items.tsx` - 품목 추가/수정/삭제 (Client Component)
   - 품목 테이블: 제품ID, 수량, 단가, 소계, 메모
   - Dialog 기반 추가/수정 폼
   - 소계 자동 계산
   - 전체 합계 표시

4. **페이지 구현**
   - `src/app/(dashboard)/purchases/new/page.tsx` - 신규 발주 등록 (Server Component)
   - `src/app/(dashboard)/purchases/[id]/page.tsx` - 발주 상세 (Server Component)
   - `src/app/(dashboard)/purchases/[id]/edit/page.tsx` - 발주 수정 (Server Component)

5. **상세 페이지 구성**
   - 헤더: 발주번호, 상태, 생성일, 수정 버튼
   - 상태 관리 카드
   - 발주 정보 카드 (거래처명, 연락처, 합계 금액, 결제일, 메모)
   - 품목 관리 카드

### 사이드바 네비게이션

- `src/components/layout/sidebar.tsx` 수정
- 메뉴 추가: "발주 관리" (/purchases)
- Icon: ShoppingCart

---

## 주요 결정사항

1. **ViewSwitcher 재사용**
   - 기존 수주 관리의 패턴 일관성 유지
   - 리스트/타임라인 2가지 뷰만 제공 (칸반은 발주에는 부적합)

2. **금액 표시**
   - "₩XXX만" 포맷 (만원 단위 표시)
   - 입력: 천 단위 구분 (1,000,000)
   - DB 저장: 원 단위 (integer)

3. **품목 관리**
   - 품목 테이블은 별도 Dialog로 관리 (인라인 편집보다 UX 단순화)
   - product_id는 optional (Phase 2에서 제품 마스터 연동 예정)
   - 소계 자동 계산 (수량 × 단가)

4. **상태 전이 규칙**
   - 정방향: draft → ordered → received → settled → cost_confirmed
   - 역방향 허용 (예: ordered → draft, received → ordered)
   - 최종 상태(cost_confirmed)에서는 전이 불가

---

## 기술 스택

- **Form:** react-hook-form + @hookform/resolvers/zod
- **Validation:** zod (purchaseOrderFormSchema, purchaseOrderItemSchema)
- **UI:** shadcn/ui (Button, Input, Label, Textarea, Badge, Card, Table, Dialog, Tabs)
- **Server Actions:** actions.ts (이미 구현됨)
  - getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder
  - transitionPurchaseOrderStatus
  - addPurchaseOrderItem, updatePurchaseOrderItem, removePurchaseOrderItem

---

## 검증 결과

### 빌드 성공
```bash
npm run build
```
- TypeScript 오류: 0
- Lint 오류: 0
- 컴파일 성공

### 생성된 라우트
- /purchases - 발주 목록 (리스트/타임라인)
- /purchases/new - 발주 등록
- /purchases/[id] - 발주 상세
- /purchases/[id]/edit - 발주 수정

---

## 알려진 이슈

없음.

---

## 다음 단계

1. **T5.4 (Optional):** 발주 입고 처리 (receive flow)
   - 발주 품목별 입고 수량 기록
   - 재고 증가 트리거
   - 입고 완료 시 상태 전이

2. **Phase 2:**
   - 제품 마스터 연동 (product_id 드롭다운 검색)
   - 수주-발주 연결 (order_id 참조)
   - 발주 품목 일괄 입력 (CSV/Excel import)

---

## 파일 목록

### 신규 생성 파일
```
src/components/purchases/
├── purchase-order-list.tsx
├── purchase-order-timeline.tsx
├── purchases-view-container.tsx
├── purchase-order-form.tsx
├── purchase-order-status-bar.tsx
└── purchase-order-items.tsx

src/app/(dashboard)/purchases/
├── page.tsx
├── new/page.tsx
├── [id]/page.tsx
└── [id]/edit/page.tsx
```

### 수정 파일
```
src/components/layout/sidebar.tsx (메뉴 추가)
```

### 참조 파일 (기존)
```
src/app/(dashboard)/purchases/actions.ts
src/lib/schemas/purchase-order.ts
src/hooks/use-view-state.ts
src/components/common/view-switcher.tsx
```

---

## 커밋 메시지 (예시)

```
feat(purchases): T5.2/T5.3 발주 리스트/타임라인 + 등록/수정 폼

- 발주 리스트/타임라인 뷰 (ViewSwitcher 통합)
- 상태 필터 탭 (draft, ordered, received, settled, cost_confirmed)
- 검색 기능 (발주번호/거래처명)
- 발주 등록/수정 폼 (거래처 정보, 금액, 결제일, 메모)
- 상태 전이 바 (5단계 프로그레스 인디케이터)
- 품목 관리 (추가/수정/삭제, Dialog 기반)
- 사이드바 "발주 관리" 메뉴 추가

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

**상태:** ✅ 완료
**빌드:** ✅ 성공
**테스트:** ⏸️ 수동 테스트 필요 (QA 에이전트 실행 예정)
