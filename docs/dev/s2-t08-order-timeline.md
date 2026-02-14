# S2-T08: 수주 타임라인 뷰

## 완료 항목
- 날짜별 그룹화 타임라인 뷰
- 세로 라인 + 도트 노드 스타일
- 수주번호, 고객명, 상태 Badge, 유형, 금액 표시
- 상태별 주요 일정 자동 표시 (설치일/실측일)
- 클릭 시 상세 페이지 이동
- 빈 상태 처리

## 주요 결정사항
- created_at 기준 날짜별 그룹화 (최신순)
- ViewSwitcher timeline 옵션으로 접근

## 파일
- `src/components/orders/order-timeline-view.tsx`
