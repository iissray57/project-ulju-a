-- ============================================================
-- 1. 거래처(공급업체) 테이블 생성
-- 2. 발주서에 발주일, 할인율, 거래처 ID 추가
-- ============================================================

-- 1. 거래처 테이블
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  business_number TEXT,  -- 사업자등록번호
  contact_person TEXT,   -- 담당자명
  memo TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 거래처 인덱스
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(user_id, name);

-- 거래처 RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own suppliers" ON suppliers;
CREATE POLICY "Users can manage their own suppliers" ON suppliers
  FOR ALL USING (auth.uid() = user_id);

-- 거래처 중복 방지 (같은 사용자의 동일 이름+전화번호)
ALTER TABLE suppliers ADD CONSTRAINT suppliers_user_name_phone_unique
  UNIQUE (user_id, name, phone);

-- 2. 발주서 테이블 확장
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS order_date DATE;           -- 발주일
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC;   -- 할인 전 금액
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS discount_rate NUMERIC;     -- 할인율 (%)

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);

-- 코멘트
COMMENT ON TABLE suppliers IS '거래처(공급업체) 정보';
COMMENT ON COLUMN suppliers.business_number IS '사업자등록번호';
COMMENT ON COLUMN suppliers.contact_person IS '담당자명';

COMMENT ON COLUMN purchase_orders.supplier_id IS '거래처 ID (suppliers 참조)';
COMMENT ON COLUMN purchase_orders.order_date IS '발주일';
COMMENT ON COLUMN purchase_orders.subtotal_amount IS '할인 전 금액';
COMMENT ON COLUMN purchase_orders.discount_rate IS '할인율 (%)';
