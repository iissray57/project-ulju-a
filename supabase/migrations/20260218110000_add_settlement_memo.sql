-- 정산 메모 컬럼 추가
ALTER TABLE orders ADD COLUMN IF NOT EXISTS settlement_memo TEXT;
COMMENT ON COLUMN orders.settlement_memo IS '정산 메모 (결제 상세 내역)';
