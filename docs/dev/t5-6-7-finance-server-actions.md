# T5.6 & T5.7: Finance Server Actions (매출/매입 확정)

**담당**: executor (a86c4db)
**작업일**: 2026-02-14
**스프린트**: Sprint 5 - 재고/발주/손익 관리

## 완료 항목

### 1. 스키마 정의 (`src/lib/schemas/finance.ts`)
- ✅ `revenueFormSchema`: 매출 확정 기록 (order_id, confirmed_amount, confirmed_at, payment_date, payment_method, memo)
- ✅ `costFormSchema`: 매입 확정 기록 (purchase_order_id, order_id, confirmed_amount, confirmed_at, payment_date, payment_method, memo)
- ✅ `FINANCE_SUMMARY_PERIOD`: 'monthly' | 'quarterly' | 'yearly' 집계 주기 타입

### 2. 매출 (Revenue) Server Actions (`src/app/(dashboard)/finance/actions.ts`)
- ✅ `getRevenueRecords`: 매출 목록 조회 (기간 필터, 페이지네이션)
- ✅ `createRevenueRecord`: 매출 확정 기록 생성
- ✅ `deleteRevenueRecord`: 매출 기록 삭제
- ✅ `getRevenueByOrder`: 특정 수주의 매출 이력 조회
- ✅ `getRevenueSummary`: 기간별 매출 합계 (월/분기/연)
- ✅ `getMonthlyRevenueSummary`: 월별 매출 합계

### 3. 매입 (Cost) Server Actions
- ✅ `getCostRecords`: 매입 목록 조회 (기간 필터, 페이지네이션)
- ✅ `createCostRecord`: 매입 확정 기록 생성
- ✅ `deleteCostRecord`: 매입 기록 삭제
- ✅ `getCostByPurchaseOrder`: 특정 발주의 매입 이력 조회
- ✅ `getCostSummary`: 기간별 매입 합계 (월/분기/연)
- ✅ `getMonthlyCostSummary`: 월별 매입 합계

### 4. 손익 (Profit/Loss) Actions
- ✅ `getProfitLossSummary`: 기간별 손익 조회 (revenue, cost, profit, profit_margin)

### 5. 버그 수정 (Purchase Order Actions)
- ✅ `supplier` → `supplier_name`로 필드명 수정 (DB 스키마에 맞춤)
- ✅ `PurchaseOrderWithOrder` 타입 제거 (미사용 타입 정리)
- ✅ `order_id` 필드 제거 (purchase_orders 테이블에 없음)

## 주요 결정사항

### 1. 매출/매입 독립 관리
- **매출**: `revenue_records` 테이블로 수주(`orders`)와 별도 관리
- **매입**: `cost_records` 테이블로 발주(`purchase_orders`)와 별도 관리
- **이유**: 수주 상태와 무관하게 매출/매입 확정 시점을 유연하게 기록 가능

### 2. 기간별 집계 로직
- **서버 측**: 기간 필터링 후 데이터 조회 (DB query)
- **클라이언트 측**: JavaScript로 월/분기/연 집계 (Map 자료구조 활용)
- **이유**: Supabase PostgreSQL에서 GROUP BY 집계보다 클라이언트 측 집계가 더 유연하고 간단

### 3. 손익 계산
- **profit_margin**: (profit / revenue) * 100
- **소수점 2자리**: `Math.round(profit_margin * 100) / 100`
- **0 나누기 방지**: revenue가 0일 경우 profit_margin = 0

## 검증 결과

### Build
```bash
npm run build
```
- ✅ TypeScript 타입 체크 통과
- ✅ Next.js 빌드 성공
- ✅ LSP 진단: `/src/lib/schemas/finance.ts` 오류 없음
- ✅ LSP 진단: `/src/app/(dashboard)/finance/actions.ts` 오류 없음

## 파일 목록

```
/root/project/project-ulju-a/
├── src/lib/schemas/finance.ts (신규)
└── src/app/(dashboard)/finance/actions.ts (신규)
```

## 다음 단계 (Next Sprint)

### T5.8: 재고 소진 알림 (Low Stock Alerts)
- 안전 재고 수준 설정
- 알림 조건 체크 로직
- 푸시 알림 연동 (optional)

### T5.9: 손익 대시보드 UI
- 매출/매입/손익 차트 (recharts)
- 기간별 필터 (월/분기/연)
- CSV 내보내기 기능

## 알려진 이슈
없음

## 참고 자료
- Plan: `.omc/plans/closet-biz-system-final.md` (Section 5.3: 손익 관리)
- DB: `supabase/migrations/20260214000000_initial_schema.sql`
