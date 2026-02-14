-- ============================================================
-- Sprint 5 & 6 Schema Extensions
-- Sprint 5 Task 5.4: receive_purchase_order RPC
-- Sprint 6 Tasks: closet_component_presets, closet_models tables
-- ============================================================

-- ============================================================
-- RPC: receive_purchase_order (Sprint 5 T5.4)
-- 입고 처리: 발주 상태 변경 + 재고 증가 + 트랜잭션 기록
-- ============================================================
CREATE OR REPLACE FUNCTION receive_purchase_order(
  p_purchase_order_id UUID,
  p_items JSONB DEFAULT NULL  -- [{product_id, quantity}] 부분 입고 지원
)
RETURNS JSONB AS $$
DECLARE
  v_po RECORD;
  v_item RECORD;
  v_received JSONB := '[]'::JSONB;
BEGIN
  -- 발주 확인
  SELECT * INTO v_po FROM purchase_orders
  WHERE id = p_purchase_order_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', '발주를 찾을 수 없습니다');
  END IF;

  IF v_po.status != 'ordered' THEN
    RETURN jsonb_build_object('success', false, 'error', '주문 상태에서만 입고 처리가 가능합니다');
  END IF;

  -- 발주 품목별 입고 처리
  IF p_items IS NULL THEN
    -- 전체 입고: purchase_order_items 전체를 입고
    FOR v_item IN
      SELECT poi.product_id, poi.quantity
      FROM purchase_order_items poi
      WHERE poi.purchase_order_id = p_purchase_order_id
    LOOP
      -- inventory 증가
      UPDATE inventory
      SET current_quantity = current_quantity + v_item.quantity,
          available_quantity = available_quantity + v_item.quantity
      WHERE product_id = v_item.product_id AND user_id = auth.uid();

      -- 트랜잭션 기록
      INSERT INTO inventory_transactions (
        user_id, product_id, purchase_order_id, type, quantity,
        before_quantity, after_quantity, memo
      )
      SELECT
        auth.uid(), v_item.product_id, p_purchase_order_id, 'inbound',
        v_item.quantity, i.current_quantity - v_item.quantity, i.current_quantity,
        '발주 입고: ' || v_po.po_number
      FROM inventory i WHERE i.product_id = v_item.product_id AND i.user_id = auth.uid();

      v_received := v_received || jsonb_build_object(
        'product_id', v_item.product_id, 'quantity', v_item.quantity
      );
    END LOOP;
  ELSE
    -- 부분 입고: p_items에 명시된 품목만
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT)
    LOOP
      UPDATE inventory
      SET current_quantity = current_quantity + v_item.quantity,
          available_quantity = available_quantity + v_item.quantity
      WHERE product_id = v_item.product_id AND user_id = auth.uid();

      INSERT INTO inventory_transactions (
        user_id, product_id, purchase_order_id, type, quantity,
        before_quantity, after_quantity, memo
      )
      SELECT
        auth.uid(), v_item.product_id, p_purchase_order_id, 'inbound',
        v_item.quantity, i.current_quantity - v_item.quantity, i.current_quantity,
        '발주 입고: ' || v_po.po_number
      FROM inventory i WHERE i.product_id = v_item.product_id AND i.user_id = auth.uid();

      v_received := v_received || jsonb_build_object(
        'product_id', v_item.product_id, 'quantity', v_item.quantity
      );
    END LOOP;
  END IF;

  -- 발주 상태 변경
  UPDATE purchase_orders SET status = 'received', updated_at = NOW()
  WHERE id = p_purchase_order_id;

  RETURN jsonb_build_object('success', true, 'received_items', v_received);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Table: closet_component_presets (Sprint 6)
-- 프리셋 컴포넌트 라이브러리 (시스템 기본 + 사용자 커스텀)
-- ============================================================
CREATE TABLE IF NOT EXISTS closet_component_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  name TEXT NOT NULL,
  category product_category NOT NULL,
  preset_data JSONB NOT NULL,
  thumbnail_url TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE closet_component_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own presets and view system" ON closet_component_presets
  FOR ALL USING (user_id = auth.uid() OR is_system = TRUE) WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_presets_user ON closet_component_presets(user_id);
CREATE INDEX idx_presets_category ON closet_component_presets(category);

-- ============================================================
-- Table: closet_models (Sprint 6 T6.11)
-- 수주별 3D 모델 데이터 (Three.js scene)
-- ============================================================
CREATE TABLE IF NOT EXISTS closet_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '기본 모델',
  model_data JSONB NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE closet_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own models" ON closet_models
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_models_order ON closet_models(order_id);
CREATE INDEX idx_models_user ON closet_models(user_id);
