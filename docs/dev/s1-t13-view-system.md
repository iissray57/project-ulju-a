# S1-T13: 뷰 시스템 기반

## 완료 항목
- `ViewType`: kanban/list/grid/timeline/calendar/agenda/map/summary 8종
- `ViewConfig`: 뷰 타입별 라벨, 아이콘, 브레이크포인트 기본값 정의
- `ViewSwitcher`: 토글 버튼 그룹 (활성 뷰 하이라이트, aria-pressed)
- `ViewContainer`: 현재 뷰에 맞는 컴포넌트 렌더링 (fallback 지원)
- `useViewState`: 반응형 뷰 상태 관리 (mobile/tablet/desktop 브레이크포인트 + localStorage 영속화)

## 주요 결정사항
- 브레이크포인트: mobile(<768) / tablet(<1024) / desktop(>=1024)
- 저장된 뷰 선호 없으면 브레이크포인트별 기본 뷰 자동 선택
- 뷰 아이콘은 모바일에서 숨김, sm 이상에서 표시

## 파일
- `src/lib/types/views.ts`
- `src/components/common/view-switcher.tsx`
- `src/components/common/view-container.tsx`
- `src/hooks/use-view-state.ts`
