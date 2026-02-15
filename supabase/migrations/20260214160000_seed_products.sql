-- 기초 품목 데이터 시드
-- 시스템장 깊이 400 고정, 프레임 색상별, 너비별 품목

-- =============================================
-- 1. 시스템 프레임 (시스템장 본체 프레임)
-- 색상: 실버, 화이트, 골드, 블랙
-- 너비: 300, 400, 450, 500, 600, 700, 800, 900
-- =============================================

-- 임시 함수: user_id 없이 products에 삽입 (RLS 비활성화 상태에서 실행)
-- 실제 환경에서는 특정 user_id를 지정하거나, 앱에서 등록해야 함

-- 이 시드는 관리자 권한으로 실행됩니다
-- auth.uid()가 없는 상황에서는 user_id를 지정해야 합니다
-- 아래는 예시 데이터로, 실제 사용 시 앱에서 등록하거나 user_id를 수정해야 합니다

DO $$
DECLARE
    frame_colors TEXT[] := ARRAY['실버', '화이트', '골드', '블랙'];
    frame_color_codes TEXT[] := ARRAY['SV', 'WH', 'GD', 'BK'];
    widths INT[] := ARRAY[300, 400, 450, 500, 600, 700, 800, 900];
    shelf_colors TEXT[] := ARRAY['화이트오크', '메이플', '월넛', '화이트'];
    shelf_color_codes TEXT[] := ARRAY['WO', 'MP', 'WN', 'WH'];
    i INT;
    j INT;
    test_user_id UUID;
BEGIN
    -- 테스트용: 첫 번째 사용자 ID 가져오기 (없으면 건너뜀)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No users found. Skipping seed data insertion. Please register products through the app.';
        RETURN;
    END IF;

    -- 1. 시스템 프레임 (색상 x 너비)
    FOR i IN 1..array_length(frame_colors, 1) LOOP
        FOR j IN 1..array_length(widths, 1) LOOP
            INSERT INTO products (user_id, name, category, sku, unit, unit_price, min_stock, memo, is_active)
            VALUES (
                test_user_id,
                '시스템프레임 ' || frame_colors[i] || ' ' || widths[j] || 'x400',
                'system_frame',
                'SF-' || frame_color_codes[i] || '-' || widths[j],
                'EA',
                0,
                5,
                '깊이 400 고정',
                true
            )
            ON CONFLICT (user_id, sku) DO NOTHING;
        END LOOP;
    END LOOP;

    -- 2. 상판 (색상 x 너비) - 깊이 400 고정
    FOR i IN 1..array_length(shelf_colors, 1) LOOP
        FOR j IN 1..array_length(widths, 1) LOOP
            INSERT INTO products (user_id, name, category, sku, unit, unit_price, min_stock, memo, is_active)
            VALUES (
                test_user_id,
                '상판 ' || shelf_colors[i] || ' ' || widths[j] || 'x400',
                'shelf',
                'SH-' || shelf_color_codes[i] || '-' || widths[j],
                'EA',
                0,
                3,
                '깊이 400 고정',
                true
            )
            ON CONFLICT (user_id, sku) DO NOTHING;
        END LOOP;
    END LOOP;

    -- 3. 서랍장 2단, 3단, 4단 (가로 800)
    INSERT INTO products (user_id, name, category, sku, unit, unit_price, min_stock, memo, is_active)
    VALUES
        (test_user_id, '서랍장 2단 800', 'drawer', 'DR-2D-800', 'EA', 0, 3, '가로 800mm, 2단 서랍', true),
        (test_user_id, '서랍장 3단 800', 'drawer', 'DR-3D-800', 'EA', 0, 3, '가로 800mm, 3단 서랍', true),
        (test_user_id, '서랍장 4단 800', 'drawer', 'DR-4D-800', 'EA', 0, 3, '가로 800mm, 4단 서랍', true)
    ON CONFLICT (user_id, sku) DO NOTHING;

    -- 4. 거울장 (가로 400)
    INSERT INTO products (user_id, name, category, sku, unit, unit_price, min_stock, memo, is_active)
    VALUES
        (test_user_id, '거울장 400', 'door', 'MR-400', 'EA', 0, 2, '가로 400mm 거울장', true)
    ON CONFLICT (user_id, sku) DO NOTHING;

    -- 5. 행거봉 (너비별)
    FOR j IN 1..array_length(widths, 1) LOOP
        INSERT INTO products (user_id, name, category, sku, unit, unit_price, min_stock, memo, is_active)
        VALUES (
            test_user_id,
            '행거봉 ' || widths[j],
            'hanger_bar',
            'HB-' || widths[j],
            'EA',
            0,
            5,
            '너비 ' || widths[j] || 'mm',
            true
        )
        ON CONFLICT (user_id, sku) DO NOTHING;
    END LOOP;

    RAISE NOTICE 'Seed products inserted for user: %', test_user_id;
END $$;

-- products 테이블에 user_id + sku 유니크 제약 추가 (없는 경우)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_user_id_sku_unique'
    ) THEN
        ALTER TABLE products ADD CONSTRAINT products_user_id_sku_unique UNIQUE (user_id, sku);
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Constraint may already exist or could not be added: %', SQLERRM;
END $$;
