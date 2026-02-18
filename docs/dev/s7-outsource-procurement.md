# S7. 외주 발주 체계 구현

## 완료 항목

### T1. DB 마이그레이션
- `outsource_orders` 테이블 생성 (RLS, 인덱스 포함)
- `generate_outsource_number` RPC (OS-YYYYMMDD-NNN 자동 채번)

### T2. 서버 액션 (CRUD + 상태 전이)
- `outsource-actions.ts`: CRUD, 상태 전이(requested→in_progress→completed/cancelled), 주문별 요약
- 상태 전이 규칙 강제, 완료/취소 상태 수정 방지

### T3. 외주 발주 UI
- `outsource-orders-section.tsx`: 주문 상세 내 외주 발주 목록 테이블
- `outsource-order-dialog.tsx`: 생성/편집 다이얼로그 (거래처 디바운스 검색)

### T4. 작업→정산대기 전이 검증
- 외주 발주 존재 시 전체 완료(completed/cancelled) 확인 필수
- `status-transition-form-dialog.tsx`에 외주 완료 현황 표시

### T5. 외주 발주서 PDF + 클립보드 복사
- `outsource-order-document.tsx`: A4 PDF 템플릿 (고객정보 + 스펙 + 이미지)
- `outsource-order-pdf-button.tsx`: PDF 다운로드 + 텍스트 클립보드 복사

### T6. 원가/마진 계산
- `getOrderCostSummary`: 자재 원가 + 외주 원가 집계
- `order-cost-summary.tsx`: 매출/원가/마진율 카드

### T7. 코드 리뷰 + 보안 수정
- CRITICAL 2건: PDF API user_id 필터, 서버 액션 인증 누락
- HIGH 5건: 상태 검증, allCompleted 로직, cancelled 금액 제외 등
- MEDIUM 5건: react-pdf 호환, stale data 등

## 주요 결정사항
- 외주 발주는 주문 상세 페이지 내 섹션으로 배치 (별도 메뉴 X)
- cancelled 상태도 종결 상태로 취급 (allCompleted 판정)
- totalAmount에서 cancelled 금액 제외
- PDF는 React.createElement 방식 (react-pdf JSX 미지원)

## 커밋 이력
- `77bcfc4` feat(outsource): 외주 발주 UI 컴포넌트
- `e3cb183` feat(outsource): 외주 완료 검증 + 원가/마진 계산
- `d1eb69c` feat(outsource): 외주 발주서 PDF + 클립보드 복사
- `960346c` fix(outsource): 코드 리뷰 보안/로직 이슈 수정
