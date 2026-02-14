# S2-T10: 수주 상세 페이지

## 완료 항목
- `/orders/[id]` 수주 상세 페이지 구현
- 상태 프로그레스 인디케이터 (9단계, cancelled 별도)
- 상태 전이 버튼 (정방향/역방향/취소)
- 취소 확인 다이얼로그
- 정보 카드 그리드: 고객 정보, 옷장 사양, 금액 정보, 일정
- 메모 섹션 (현장 메모, 일반 메모)
- toast 알림 (상태 전이 성공/실패)

## 주요 결정사항
- Server Component 우선, OrderStatusBar만 Client Component
- ORDER_TRANSITIONS 기반 동적 버튼 생성
- 자재 목록/변경 이력은 Sprint 3에서 구현

## 파일
- `src/app/(dashboard)/orders/[id]/page.tsx`
- `src/components/orders/order-status-bar.tsx`
- `src/components/orders/order-detail-sections.tsx`
