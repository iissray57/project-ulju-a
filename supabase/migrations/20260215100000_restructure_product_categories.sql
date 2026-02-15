-- 품목 카테고리 재정의: 앵글/시스템장/커튼 3대분류

-- 1. 모든 의존 테이블의 category 컬럼을 text로 변경
ALTER TABLE products ALTER COLUMN category TYPE text USING category::text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'category'
  ) THEN
    EXECUTE 'ALTER TABLE inventory_items ALTER COLUMN category TYPE text USING category::text';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'closet_component_presets' AND column_name = 'category'
  ) THEN
    EXECUTE 'ALTER TABLE closet_component_presets ALTER COLUMN category TYPE text USING category::text';
  END IF;
END $$;

-- 2. 기존 데이터 카테고리 매핑 (구 → 신)
UPDATE products SET category = CASE category
  WHEN 'angle_frame' THEN 'angle'
  WHEN 'system_frame' THEN 'system_frame'
  WHEN 'top_panel' THEN 'top_panel'
  WHEN 'drawer' THEN 'drawer'
  WHEN 'mirror' THEN 'mirror_cabinet'
  WHEN 'shelf' THEN 'system_frame'
  WHEN 'door' THEN 'system_frame'
  WHEN 'hardware' THEN 'system_frame'
  WHEN 'accessory' THEN 'system_frame'
  WHEN 'hanger_bar' THEN 'system_frame'
  WHEN 'tray' THEN 'drawer'
  WHEN 'lighting' THEN 'system_frame'
  ELSE 'system_frame'
END;

-- 3. 기존 enum 삭제
DROP TYPE IF EXISTS product_category;

-- 4. 새 enum 생성
CREATE TYPE product_category AS ENUM (
  'angle',          -- 앵글
  'plywood',        -- 합판
  'raw_sheet',      -- 원장
  'system_frame',   -- 프레임
  'top_panel',      -- 상판
  'drawer',         -- 서랍장
  'mirror_cabinet', -- 거울장
  'blind',          -- 블라인드
  'curtain'         -- 커튼
);

-- 5. 테이블 컬럼을 새 enum으로 변경
ALTER TABLE products ALTER COLUMN category TYPE product_category USING category::product_category;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'category'
  ) THEN
    EXECUTE 'ALTER TABLE inventory_items ALTER COLUMN category TYPE product_category USING category::product_category';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'closet_component_presets' AND column_name = 'category'
  ) THEN
    EXECUTE 'ALTER TABLE closet_component_presets ALTER COLUMN category TYPE product_category USING category::product_category';
  END IF;
END $$;
