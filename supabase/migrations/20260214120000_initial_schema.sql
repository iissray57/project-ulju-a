-- Phase 1 Initial Schema Migration
-- 공통 트리거 함수 및 ENUM 타입, Phase 1 테이블 정의

-- 0. 공통 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ENUM 타입들
CREATE TYPE order_status AS ENUM (
  'inquiry', 'quotation_sent', 'confirmed', 'measurement_done',
  'date_fixed', 'material_held', 'installed', 'settlement_wait',
  'revenue_confirmed', 'cancelled'
);

CREATE TYPE product_category AS ENUM (
  'angle_frame', 'system_frame', 'shelf', 'hanger_bar',
  'drawer', 'door', 'hardware', 'accessory', 'etc'
);

CREATE TYPE po_status AS ENUM (
  'draft', 'ordered', 'received', 'settled', 'cost_confirmed'
);

CREATE TYPE transaction_type AS ENUM (
  'inbound', 'outbound', 'hold', 'release_hold', 'adjustment'
);

CREATE TYPE schedule_type AS ENUM (
  'measurement', 'installation', 'visit', 'delivery', 'other'
);

-- 1. customers
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  address_detail TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. orders
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  status order_status DEFAULT 'inquiry',
  quotation_amount BIGINT DEFAULT 0,
  confirmed_amount BIGINT DEFAULT 0,
  closet_type TEXT,
  closet_spec JSONB DEFAULT '{}',
  measurement_date DATE,
  installation_date DATE,
  site_address TEXT,
  site_photos TEXT[],
  site_memo TEXT,
  preparation_checklist JSONB DEFAULT '[]',
  installation_checklist JSONB DEFAULT '[]',
  model_scene_data JSONB,
  payment_method TEXT,
  payment_date DATE,
  revenue_confirmed_at TIMESTAMPTZ,
  cost_confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_from_status order_status,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT := TO_CHAR(NOW(), 'YYYY');
  v_max_seq INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SPLIT_PART(order_number, '-', 3) AS INT)), 0)
  INTO v_max_seq
  FROM orders
  WHERE order_number LIKE 'CB-' || v_year || '-%';
  RETURN 'CB-' || v_year || '-' || LPAD((v_max_seq + 1)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. products
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  category product_category NOT NULL,
  sku TEXT,
  unit TEXT DEFAULT 'EA',
  unit_price BIGINT DEFAULT 0,
  min_stock INT DEFAULT 0,
  memo TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sku)
);
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. inventory
CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0
    CONSTRAINT chk_inventory_quantity CHECK (quantity >= 0),
  held_quantity INT NOT NULL DEFAULT 0
    CONSTRAINT chk_inventory_held CHECK (held_quantity >= 0),
  available_quantity INT GENERATED ALWAYS AS (quantity - held_quantity) STORED,
  warehouse_location TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id),
  CONSTRAINT chk_inventory_held_le_quantity CHECK (held_quantity <= quantity)
);
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. purchase_orders
CREATE TABLE purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  po_number TEXT UNIQUE NOT NULL,
  supplier_name TEXT,
  supplier_phone TEXT,
  status po_status DEFAULT 'draft',
  total_amount BIGINT DEFAULT 0,
  payment_date DATE,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT := TO_CHAR(NOW(), 'YYYY');
  v_max_seq INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SPLIT_PART(po_number, '-', 3) AS INT)), 0)
  INTO v_max_seq
  FROM purchase_orders
  WHERE po_number LIKE 'PO-' || v_year || '-%';
  RETURN 'PO-' || v_year || '-' || LPAD((v_max_seq + 1)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. purchase_order_items
CREATE TABLE purchase_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INT NOT NULL
    CONSTRAINT chk_poi_quantity CHECK (quantity > 0),
  unit_price BIGINT NOT NULL,
  total_price BIGINT GENERATED ALWAYS AS (quantity * unit_price) STORED,
  received_quantity INT DEFAULT 0
    CONSTRAINT chk_poi_received CHECK (received_quantity >= 0),
  memo TEXT,
  CONSTRAINT chk_poi_received_le_quantity CHECK (received_quantity <= quantity)
);

-- 7. order_materials
CREATE TABLE order_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  planned_quantity INT NOT NULL DEFAULT 0,
  used_quantity INT NOT NULL DEFAULT 0,
  held_quantity INT NOT NULL DEFAULT 0,
  shortage_quantity INT NOT NULL DEFAULT 0,
  memo TEXT
);

-- 8. inventory_transactions
CREATE TABLE inventory_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  type transaction_type NOT NULL,
  quantity INT NOT NULL,
  before_quantity INT NOT NULL,
  after_quantity INT NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. schedules
CREATE TABLE schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  type schedule_type NOT NULL,
  title TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration_minutes INT,
  location TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. report_templates
CREATE TABLE report_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  template_data JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. generated_reports
CREATE TABLE generated_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  report_data JSONB NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. revenue_records
CREATE TABLE revenue_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  confirmed_amount BIGINT NOT NULL,
  payment_method TEXT,
  payment_date DATE,
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. cost_records
CREATE TABLE cost_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  confirmed_amount BIGINT NOT NULL,
  payment_method TEXT,
  payment_date DATE,
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_installation_date ON orders(installation_date);
CREATE INDEX idx_orders_measurement_date ON orders(measurement_date);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_user ON inventory(user_id);
CREATE INDEX idx_schedules_date ON schedules(scheduled_date);
CREATE INDEX idx_schedules_order ON schedules(order_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_user ON purchase_orders(user_id);
CREATE INDEX idx_customers_user ON customers(user_id);
CREATE INDEX idx_products_user ON products(user_id);
CREATE INDEX idx_inv_tx_product ON inventory_transactions(product_id);
CREATE INDEX idx_inv_tx_order ON inventory_transactions(order_id);
CREATE INDEX idx_inv_tx_po ON inventory_transactions(purchase_order_id);
CREATE INDEX idx_inv_tx_type ON inventory_transactions(type);
CREATE INDEX idx_inv_tx_created ON inventory_transactions(created_at);
CREATE INDEX idx_poi_po ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_poi_product ON purchase_order_items(product_id);
CREATE INDEX idx_om_order ON order_materials(order_id);
CREATE INDEX idx_om_product ON order_materials(product_id);
CREATE INDEX idx_schedules_user ON schedules(user_id);
CREATE INDEX idx_schedules_type ON schedules(type);
CREATE INDEX idx_schedules_active ON schedules(is_active);
CREATE INDEX idx_gen_reports_order ON generated_reports(order_id);
CREATE INDEX idx_revenue_records_order ON revenue_records(order_id);
CREATE INDEX idx_revenue_records_user ON revenue_records(user_id);
CREATE INDEX idx_revenue_records_date ON revenue_records(confirmed_at);
CREATE INDEX idx_cost_records_po ON cost_records(purchase_order_id);
CREATE INDEX idx_cost_records_order ON cost_records(order_id);
CREATE INDEX idx_cost_records_user ON cost_records(user_id);
CREATE INDEX idx_cost_records_date ON cost_records(confirmed_at);
