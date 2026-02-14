# S1-T06: RPC Functions

## 완료 항목
- 4개 RPC Function 구현 (SECURITY DEFINER)
  - `hold_materials_for_order`: 자재 hold (partial/strict 모드)
  - `dispatch_materials_for_order`: 자재 출고 (material_held → installed)
  - `release_held_materials`: hold 해제
  - `cancel_order_cascade`: 취소 연쇄 (hold 해제 + 스케줄 비활성화 + 발주 배분 해제)
- 소유권 검증 (`auth.uid()`) 포함
- `FOR UPDATE` 행 잠금으로 트랜잭션 원자성 보장

## 주요 결정사항
- `cancel_order_cascade`에서 `release_held_materials` 내부 호출로 코드 재사용
- `installed`, `settlement_wait`, `revenue_confirmed`, `cancelled` 상태에서는 취소 불가

## 파일
- `supabase/migrations/20260214140000_rpc_functions.sql`
