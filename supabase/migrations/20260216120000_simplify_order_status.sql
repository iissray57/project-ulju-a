-- 주문 상태 5단계로 간소화
-- 기존: inquiry → quotation_sent → confirmed → measurement_done → date_fixed → material_held → installed → settlement_wait → revenue_confirmed
-- 변경: inquiry(의뢰/실측) → quotation(견적) → work(작업) → settlement_wait(정산대기) → revenue_confirmed(매출확정)

-- 1. 기존 데이터를 새 상태로 매핑
UPDATE orders SET status = 'inquiry' WHERE status IN ('inquiry', 'measurement_done');
UPDATE orders SET status = 'quotation' WHERE status IN ('quotation_sent', 'confirmed');
UPDATE orders SET status = 'work' WHERE status IN ('date_fixed', 'material_held', 'installed');
-- settlement_wait, revenue_confirmed, cancelled는 그대로 유지

-- 2. 임시 새 enum 타입 생성
CREATE TYPE order_status_new AS ENUM (
  'inquiry',
  'quotation',
  'work',
  'settlement_wait',
  'revenue_confirmed',
  'cancelled'
);

-- 3. orders 테이블 컬럼 타입 변경
ALTER TABLE orders
  ALTER COLUMN status TYPE order_status_new
  USING status::text::order_status_new;

ALTER TABLE orders
  ALTER COLUMN cancelled_from_status TYPE order_status_new
  USING cancelled_from_status::text::order_status_new;

-- 4. 기존 enum 삭제 및 새 enum으로 교체
DROP TYPE order_status;
ALTER TYPE order_status_new RENAME TO order_status;

-- 5. 기본값 재설정
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'inquiry'::order_status;
