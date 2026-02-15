-- ============================================================
-- Fix receive_purchase_order RPC
-- 컬럼명 수정: current_quantity -> quantity, available_quantity 제거
-- 재고 레코드 없을 시 자동 생성 추가
-- ============================================================

CREATE OR REPLACE FUNCTION receive_purchase_order(
  p_purchase_order_id UUID,
  p_items JSONB DEFAULT NULL  -- [{product_id, quantity}] 부분 입고 지원
)
RETURNS JSONB AS $$
DECLARE
  v_po RECORD;
  v_item RECORD;
  v_inventory RECORD;
  v_before_qty INT;
  v_received JSONB := '[]'::JSONB;
BEGIN
  -- 발주 확인
  SELECT * INTO v_po FROM purchase_orders
  WHERE id = p_purchase_order_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', '발주를 찾을 수 없습니다');
  END IF;

  IF v_po.status NOT IN ('ordered', 'received') THEN
    RETURN jsonb_build_object('success', false, 'error', '주문 또는 입고 상태에서만 입고 처리가 가능합니다');
  END IF;

  -- 발주 품목별 입고 처리
  IF p_items IS NULL THEN
    -- 전체 입고: purchase_order_items 전체를 입고
    FOR v_item IN
      SELECT poi.product_id, poi.quantity
      FROM purchase_order_items poi
      WHERE poi.purchase_order_id = p_purchase_order_id
    LOOP
      -- 기존 재고 확인
      SELECT * INTO v_inventory FROM inventory
      WHERE product_id = v_item.product_id AND user_id = auth.uid();

      IF v_inventory IS NULL THEN
        -- 재고 레코드 생성
        INSERT INTO inventory (user_id, product_id, quantity, held_quantity)
        VALUES (auth.uid(), v_item.product_id, v_item.quantity, 0);
        v_before_qty := 0;
      ELSE
        v_before_qty := v_inventory.quantity;
        -- inventory 증가
        UPDATE inventory
        SET quantity = quantity + v_item.quantity,
            updated_at = NOW()
        WHERE product_id = v_item.product_id AND user_id = auth.uid();
      END IF;

      -- 트랜잭션 기록
      INSERT INTO inventory_transactions (
        user_id, product_id, purchase_order_id, type, quantity,
        before_quantity, after_quantity, memo
      )
      VALUES (
        auth.uid(), v_item.product_id, p_purchase_order_id, 'inbound',
        v_item.quantity, v_before_qty, v_before_qty + v_item.quantity,
        '발주 입고: ' || v_po.po_number
      );

      -- purchase_order_items의 received_quantity 업데이트
      UPDATE purchase_order_items
      SET received_quantity = COALESCE(received_quantity, 0) + v_item.quantity
      WHERE purchase_order_id = p_purchase_order_id AND product_id = v_item.product_id;

      v_received := v_received || jsonb_build_object(
        'product_id', v_item.product_id, 'quantity', v_item.quantity
      );
    END LOOP;
  ELSE
    -- 부분 입고: p_items에 명시된 품목만
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT)
    LOOP
      -- 기존 재고 확인
      SELECT * INTO v_inventory FROM inventory
      WHERE product_id = v_item.product_id AND user_id = auth.uid();

      IF v_inventory IS NULL THEN
        -- 재고 레코드 생성
        INSERT INTO inventory (user_id, product_id, quantity, held_quantity)
        VALUES (auth.uid(), v_item.product_id, v_item.quantity, 0);
        v_before_qty := 0;
      ELSE
        v_before_qty := v_inventory.quantity;
        UPDATE inventory
        SET quantity = quantity + v_item.quantity,
            updated_at = NOW()
        WHERE product_id = v_item.product_id AND user_id = auth.uid();
      END IF;

      INSERT INTO inventory_transactions (
        user_id, product_id, purchase_order_id, type, quantity,
        before_quantity, after_quantity, memo
      )
      VALUES (
        auth.uid(), v_item.product_id, p_purchase_order_id, 'inbound',
        v_item.quantity, v_before_qty, v_before_qty + v_item.quantity,
        '발주 입고: ' || v_po.po_number
      );

      -- purchase_order_items의 received_quantity 업데이트
      UPDATE purchase_order_items
      SET received_quantity = COALESCE(received_quantity, 0) + v_item.quantity
      WHERE purchase_order_id = p_purchase_order_id AND product_id = v_item.product_id;

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
-- 재고 수동 조정 RPC
-- 관리자가 직접 재고 수량을 조정 (히스토리 기록)
-- ============================================================
CREATE OR REPLACE FUNCTION adjust_inventory(
  p_product_id UUID,
  p_new_quantity INT,
  p_memo TEXT DEFAULT '수동 조정'
)
RETURNS JSONB AS $$
DECLARE
  v_inventory RECORD;
  v_before_qty INT;
  v_diff INT;
BEGIN
  -- 재고 확인
  SELECT * INTO v_inventory FROM inventory
  WHERE product_id = p_product_id AND user_id = auth.uid()
  FOR UPDATE;

  IF v_inventory IS NULL THEN
    -- 재고 레코드 생성
    INSERT INTO inventory (user_id, product_id, quantity, held_quantity)
    VALUES (auth.uid(), p_product_id, p_new_quantity, 0);
    v_before_qty := 0;
  ELSE
    v_before_qty := v_inventory.quantity;

    -- held_quantity 검증
    IF p_new_quantity < v_inventory.held_quantity THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', '새 수량이 예약 수량(' || v_inventory.held_quantity || ')보다 작을 수 없습니다'
      );
    END IF;

    UPDATE inventory
    SET quantity = p_new_quantity,
        updated_at = NOW()
    WHERE product_id = p_product_id AND user_id = auth.uid();
  END IF;

  v_diff := p_new_quantity - v_before_qty;

  -- 트랜잭션 기록
  INSERT INTO inventory_transactions (
    user_id, product_id, type, quantity,
    before_quantity, after_quantity, memo
  )
  VALUES (
    auth.uid(), p_product_id, 'adjustment',
    v_diff, v_before_qty, p_new_quantity,
    p_memo
  );

  RETURN jsonb_build_object(
    'success', true,
    'before_quantity', v_before_qty,
    'after_quantity', p_new_quantity,
    'diff', v_diff
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
