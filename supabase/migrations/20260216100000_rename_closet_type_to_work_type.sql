-- ============================================================
-- closet_type → work_type 컬럼명 변경 및 옵션 확장
-- 기존: angle, system, mixed
-- 추가: curtain (커튼 설치), demolition (철거)
-- ============================================================

-- 1. 기존 컬럼명 변경
ALTER TABLE orders RENAME COLUMN closet_type TO work_type;

-- 2. closet_spec → work_spec 컬럼명 변경 (선택적)
ALTER TABLE orders RENAME COLUMN closet_spec TO work_spec;

-- 3. 코멘트 업데이트
COMMENT ON COLUMN orders.work_type IS '작업 유형: angle(앵글), system(시스템), mixed(혼합), curtain(커튼), demolition(철거)';
COMMENT ON COLUMN orders.work_spec IS '작업 상세 사양 (JSON)';
