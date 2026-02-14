-- ============================================================
-- RPC Functions (트랜잭션 원자성 보장)
-- Sprint 1 - Task 1.6
-- ============================================================

-- ============================================================
-- RPC 1: hold_materials_for_order
-- ============================================================
CREATE OR REPLACE FUNCTION hold_materials_for_order(
  p_order_id UUID,
  p_mode TEXT DEFAULT 'partial'
)
RETURNS JSONB AS $$
DECLARE
  v_material RECORD;
  v_inventory RECORD;
  v_hold_qty INT;
  v_shortage_qty INT;
  v_results JSONB := '[]'::JSONB;
  v_has_shortage BOOLEAN := FALSE;
BEGIN
  -- 소유권 검증
  IF NOT EXISTS (SELECT 1 FROM orders WHERE id = p_order_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: order % does not belong to current user', p_order_id;
  END IF;

  FOR v_material IN
    SELECT om.id, om.product_id, om.planned_quantity
    FROM order_materials om
    WHERE om.order_id = p_order_id AND om.held_quantity = 0
  LOOP
    SELECT * INTO v_inventory
    FROM inventory
    WHERE product_id = v_material.product_id
    FOR UPDATE;

    IF v_inventory IS NULL THEN
      v_hold_qty := 0;
      v_shortage_qty := v_material.planned_quantity;
      v_has_shortage := TRUE;
    ELSIF v_inventory.available_quantity >= v_material.planned_quantity THEN
      v_hold_qty := v_material.planned_quantity;
      v_shortage_qty := 0;
    ELSE
      v_has_shortage := TRUE;
      IF p_mode = 'strict' THEN
        RAISE EXCEPTION 'Insufficient stock for product %: available=%, required=%',
          v_material.product_id, v_inventory.available_quantity, v_material.planned_quantity;
      END IF;
      v_hold_qty := GREATEST(v_inventory.available_quantity, 0);
      v_shortage_qty := v_material.planned_quantity - v_hold_qty;
    END IF;

    IF v_hold_qty > 0 AND v_inventory IS NOT NULL THEN
      UPDATE inventory
      SET held_quantity = held_quantity + v_hold_qty,
          updated_at = NOW()
      WHERE product_id = v_material.product_id;

      INSERT INTO inventory_transactions (user_id, product_id, order_id, type, quantity, before_quantity, after_quantity, memo)
      VALUES (auth.uid(), v_material.product_id, p_order_id, 'hold', v_hold_qty,
              v_inventory.held_quantity, v_inventory.held_quantity + v_hold_qty,
              'Auto hold for order');
    END IF;

    UPDATE order_materials
    SET held_quantity = v_hold_qty,
        shortage_quantity = v_shortage_qty
    WHERE id = v_material.id;

    v_results := v_results || jsonb_build_object(
      'product_id', v_material.product_id,
      'planned', v_material.planned_quantity,
      'held', v_hold_qty,
      'shortage', v_shortage_qty
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', TRUE,
    'has_shortage', v_has_shortage,
    'details', v_results
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC 2: dispatch_materials_for_order
-- ============================================================
CREATE OR REPLACE FUNCTION dispatch_materials_for_order(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_material RECORD;
  v_inventory RECORD;
BEGIN
  -- 소유권 검증
  IF NOT EXISTS (SELECT 1 FROM orders WHERE id = p_order_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: order % does not belong to current user', p_order_id;
  END IF;

  -- 주문 상태 검증: material_held 상태에서만 출고 가능
  IF NOT EXISTS (SELECT 1 FROM orders WHERE id = p_order_id AND status = 'material_held') THEN
    RAISE EXCEPTION 'Order must be in material_held status to dispatch materials';
  END IF;

  FOR v_material IN
    SELECT om.id, om.product_id, om.held_quantity
    FROM order_materials om
    WHERE om.order_id = p_order_id AND om.held_quantity > 0
  LOOP
    SELECT * INTO v_inventory
    FROM inventory
    WHERE product_id = v_material.product_id
    FOR UPDATE;

    IF v_inventory IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product %', v_material.product_id;
    END IF;

    UPDATE inventory
    SET quantity = quantity - v_material.held_quantity,
        held_quantity = held_quantity - v_material.held_quantity,
        updated_at = NOW()
    WHERE product_id = v_material.product_id;

    INSERT INTO inventory_transactions (user_id, product_id, order_id, type, quantity, before_quantity, after_quantity, memo)
    VALUES (auth.uid(), v_material.product_id, p_order_id, 'outbound', v_material.held_quantity,
            v_inventory.quantity, v_inventory.quantity - v_material.held_quantity,
            'Dispatch for installation');

    UPDATE order_materials
    SET used_quantity = v_material.held_quantity,
        held_quantity = 0
    WHERE id = v_material.id;
  END LOOP;

  UPDATE orders SET status = 'installed', updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC 3: release_held_materials
-- ============================================================
CREATE OR REPLACE FUNCTION release_held_materials(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_material RECORD;
  v_inventory RECORD;
BEGIN
  -- 소유권 검증
  IF NOT EXISTS (SELECT 1 FROM orders WHERE id = p_order_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: order % does not belong to current user', p_order_id;
  END IF;

  FOR v_material IN
    SELECT om.id, om.product_id, om.held_quantity
    FROM order_materials om
    WHERE om.order_id = p_order_id AND om.held_quantity > 0
  LOOP
    SELECT * INTO v_inventory
    FROM inventory
    WHERE product_id = v_material.product_id
    FOR UPDATE;

    IF v_inventory IS NOT NULL THEN
      UPDATE inventory
      SET held_quantity = held_quantity - v_material.held_quantity,
          updated_at = NOW()
      WHERE product_id = v_material.product_id;

      INSERT INTO inventory_transactions (user_id, product_id, order_id, type, quantity, before_quantity, after_quantity, memo)
      VALUES (auth.uid(), v_material.product_id, p_order_id, 'release_hold', v_material.held_quantity,
              v_inventory.held_quantity, v_inventory.held_quantity - v_material.held_quantity,
              'Release hold (order cancelled or replanned)');
    END IF;

    UPDATE order_materials
    SET held_quantity = 0, shortage_quantity = 0
    WHERE id = v_material.id;
  END LOOP;

  RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC 4: cancel_order_cascade
-- ============================================================
CREATE OR REPLACE FUNCTION cancel_order_cascade(
  p_order_id UUID,
  p_reason TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_release_result JSONB;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- 소유권 검증
  IF v_order.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: order % does not belong to current user', p_order_id;
  END IF;

  IF v_order.status IN ('installed', 'settlement_wait', 'revenue_confirmed', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot cancel order in status: %', v_order.status;
  END IF;

  -- 자재 hold 해제
  v_release_result := release_held_materials(p_order_id);

  -- 스케줄 비활성화
  UPDATE schedules
  SET is_active = FALSE
  WHERE order_id = p_order_id AND is_active = TRUE;

  -- draft 발주 배분 해제
  DELETE FROM purchase_order_allocations
  WHERE order_id = p_order_id;

  -- 수주 상태 업데이트
  UPDATE orders
  SET status = 'cancelled',
      cancelled_at = NOW(),
      cancellation_reason = p_reason,
      cancelled_from_status = v_order.status,
      updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'cancelled_from', v_order.status,
    'materials_released', v_release_result IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
