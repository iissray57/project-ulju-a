-- ============================================================
-- 외주 발주 (outsource_orders) 테이블 생성
-- 시스템장/커튼 외주 제작 의뢰 관리
-- ============================================================

-- 1. outsource_orders 테이블
CREATE TABLE IF NOT EXISTS outsource_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),

  outsource_number TEXT NOT NULL UNIQUE,
  outsource_type TEXT NOT NULL CHECK (outsource_type IN ('system', 'curtain')),

  spec_summary TEXT,
  memo TEXT,
  plan_image_url TEXT,
  elevation_image_url TEXT,

  amount NUMERIC NOT NULL DEFAULT 0,

  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'in_progress', 'completed', 'cancelled')),

  requested_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  completed_date DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 인덱스
CREATE INDEX IF NOT EXISTS idx_outsource_orders_order_id ON outsource_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_outsource_orders_supplier_id ON outsource_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_outsource_orders_status ON outsource_orders(status);
CREATE INDEX IF NOT EXISTS idx_outsource_orders_user_id ON outsource_orders(user_id);

-- 3. RLS
ALTER TABLE outsource_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own outsource_orders" ON outsource_orders;
CREATE POLICY "Users can view their own outsource_orders" ON outsource_orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own outsource_orders" ON outsource_orders;
CREATE POLICY "Users can insert their own outsource_orders" ON outsource_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own outsource_orders" ON outsource_orders;
CREATE POLICY "Users can update their own outsource_orders" ON outsource_orders
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own outsource_orders" ON outsource_orders;
CREATE POLICY "Users can delete their own outsource_orders" ON outsource_orders
  FOR DELETE USING (auth.uid() = user_id);

-- 4. updated_at 트리거
CREATE TRIGGER update_outsource_orders_updated_at
  BEFORE UPDATE ON outsource_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. generate_outsource_number RPC
-- 형식: OS-YYYYMMDD-NNN (오늘 날짜 기준 3자리 순번)
CREATE OR REPLACE FUNCTION generate_outsource_number()
RETURNS TEXT AS $$
DECLARE
  v_date TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
  v_max_seq INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SPLIT_PART(outsource_number, '-', 3) AS INT)), 0)
  INTO v_max_seq
  FROM outsource_orders
  WHERE outsource_number LIKE 'OS-' || v_date || '-%';
  RETURN 'OS-' || v_date || '-' || LPAD((v_max_seq + 1)::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- 6. 코멘트
COMMENT ON TABLE outsource_orders IS '외주 발주 (시스템장/커튼 제작 의뢰)';
COMMENT ON COLUMN outsource_orders.outsource_type IS '외주 유형: system(시스템장), curtain(커튼)';
COMMENT ON COLUMN outsource_orders.spec_summary IS '사양 요약 (사이즈, 색상 등)';
COMMENT ON COLUMN outsource_orders.plan_image_url IS '평면도 이미지 URL';
COMMENT ON COLUMN outsource_orders.elevation_image_url IS '입면도 이미지 URL';
COMMENT ON COLUMN outsource_orders.amount IS '외주 발주 금액 (매입 원가)';
COMMENT ON COLUMN outsource_orders.status IS '상태: requested(의뢰), in_progress(제작중), completed(완료), cancelled(취소)';
