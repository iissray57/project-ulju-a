# Sprint 1 - Task 1.4: DB 스키마 마이그레이션

## 작업 요약
Phase 1 데이터베이스 스키마 마이그레이션 파일 생성. 13개 테이블, 5개 ENUM, 자동 번호 생성 함수.

## 구현 내역

### 생성 파일
| 파일 | 설명 |
|------|------|
| `supabase/migrations/20260214120000_initial_schema.sql` | Phase 1 전체 스키마 (11KB) |

### ENUM 타입 (5개)
- `order_status`: inquiry → quotation_sent → confirmed → ... → revenue_confirmed / cancelled
- `product_category`: angle_frame, system_frame, shelf, hanger_bar, drawer, door, hardware, accessory, etc
- `po_status`: draft → ordered → received → settled → cost_confirmed
- `transaction_type`: inbound, outbound, hold, release_hold, adjustment
- `schedule_type`: measurement, installation, visit, delivery, other

### 테이블 (13개, FK 의존 순서)
1. customers
2. orders (+ generate_order_number 함수)
3. products
4. inventory (GENERATED ALWAYS AS available_quantity)
5. purchase_orders (+ generate_po_number 함수)
6. purchase_order_items (GENERATED ALWAYS AS total_price)
7. order_materials
8. inventory_transactions
9. schedules
10. report_templates
11. generated_reports
12. revenue_records
13. cost_records

### 주요 기능
- `update_updated_at_column()` 트리거 함수 (공통)
- `generate_order_number()`: CB-YYYY-NNNN 패턴
- `generate_po_number()`: PO-YYYY-NNNN 패턴
- CHECK 제약조건 (수량 >= 0, held <= quantity 등)
- 33개 인덱스 (FK, 검색 최적화)

## QA 결과
| 항목 | 결과 |
|------|------|
| 마이그레이션 파일 존재 | PASS |
| SQL 문법 검증 | PASS (구문 오류 없음) |
| 테이블 13개 포함 | PASS |
| ENUM 5개 포함 | PASS |
| Phase 2 테이블 제외 | PASS |
| RLS 미포함 (Task 1.5) | PASS |

## 비고
- Supabase 로컬 DB 미실행 상태 → SQL 실행 테스트는 Task 1.5에서 수행
- Phase 2 테이블 (purchase_order_allocations, closet_component_presets) 의도적 제외
