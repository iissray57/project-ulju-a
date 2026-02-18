-- 품목(products)에 거래처(supplier_id) 연결 추가
-- 필수가 아닌 선택 항목

ALTER TABLE products
ADD COLUMN supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);

COMMENT ON COLUMN products.supplier_id IS '기본 거래처 (선택)';
