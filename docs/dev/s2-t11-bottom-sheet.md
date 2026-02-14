# S2-T11: 모바일 신규 수주 Bottom Sheet

## 완료 항목
- Sheet side="bottom" 기반 빠른 수주 등록 폼
- 최소 필드: 고객 검색/선택, 옷장 유형, 견적 금액
- 고객 검색 debounced (300ms) + 드롭다운
- createOrder 호출 → 성공 시 상세 페이지 이동
- 모바일 FAB 트리거 (md:hidden)

## 주요 결정사항
- 기존 /orders/new 전체 폼과 별도로 빠른 등록 용도
- confirmed_amount는 0으로 기본값

## 파일
- `src/components/orders/new-order-bottom-sheet.tsx`
