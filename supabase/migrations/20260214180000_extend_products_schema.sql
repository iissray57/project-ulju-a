-- ============================================================
-- 품목 스키마 확장
-- 1. 새 카테고리 추가 (top_panel, mirror, lighting, tray)
-- 2. 규격 필드 추가 (width, depth, height, color)
-- ============================================================

-- 1. product_category enum 확장
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'top_panel';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'mirror';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'lighting';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'tray';

-- 2. products 테이블에 규격 필드 추가
ALTER TABLE products ADD COLUMN IF NOT EXISTS width INT;      -- 가로 (mm)
ALTER TABLE products ADD COLUMN IF NOT EXISTS depth INT;      -- 깊이 (mm)
ALTER TABLE products ADD COLUMN IF NOT EXISTS height INT;     -- 높이 (mm)
ALTER TABLE products ADD COLUMN IF NOT EXISTS color TEXT;     -- 색상

-- 인덱스 추가 (규격 검색용)
CREATE INDEX IF NOT EXISTS idx_products_dimensions ON products(width, depth);
CREATE INDEX IF NOT EXISTS idx_products_color ON products(color);

COMMENT ON COLUMN products.width IS '가로 길이 (mm)';
COMMENT ON COLUMN products.depth IS '깊이 (mm)';
COMMENT ON COLUMN products.height IS '높이 (mm)';
COMMENT ON COLUMN products.color IS '색상 (예: 실버, 화이트오크)';
