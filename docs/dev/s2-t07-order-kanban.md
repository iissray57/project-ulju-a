# S2-T07: 수주 칸반 뷰

## 완료 항목
- @dnd-kit/react 기반 칸반 보드 구현
- 7개 파이프라인 컬럼 (inquiry ~ installed)
- 드래그&드롭으로 상태 전이 (canTransition 검증)
- 아카이브 섹션 (settlement_wait, revenue_confirmed, cancelled)
- OrdersViewContainer: ViewSwitcher 통합 (kanban/list/timeline)
- OrderCard 공용 컴포넌트

## 주요 결정사항
- @dnd-kit/react (v0.x) 사용 - @dnd-kit/core 레거시 대신 신규 API
- 기본 뷰: 데스크탑 kanban, 모바일/태블릿 list
- 목록 limit 200으로 증가 (칸반에서 전체 데이터 필요)

## 파일
- `src/components/orders/order-kanban-view.tsx`
- `src/components/orders/order-card.tsx`
- `src/components/orders/orders-view-container.tsx`
