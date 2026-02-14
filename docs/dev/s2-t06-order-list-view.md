# S2-T06: 수주 리스트 뷰 (모바일 기본)

## 완료 항목
- `/orders` 수주 목록 페이지 구현
- 상태별 필터 칩 (전체/의뢰/견적발송/확정/진행중/완료/취소)
- debounced 검색 (수주번호, 고객명)
- 모바일: 카드 리스트, 데스크탑: 테이블
- 페이지네이션 (20건/페이지)
- URL 상태 관리 (status, q, page)
- 빈 상태 처리 + 수주 등록 링크

## 주요 결정사항
- ViewSwitcher는 칸반/타임라인 뷰 추가 후 통합 예정 (T2.7, T2.8)
- 금액 포맷: Intl.NumberFormat KRW
- 모바일 FAB → /orders/new

## 파일
- `src/app/(dashboard)/orders/page.tsx`
- `src/components/orders/order-list.tsx`
