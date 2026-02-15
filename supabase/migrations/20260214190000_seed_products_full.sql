-- ============================================================
-- 품목 전체 Seed 데이터 (앵글 시스템 + 시스템장 + 액세서리)
-- docs/product-catalog-analysis.md 기반
-- ============================================================

DO $$
DECLARE
    -- 프레임 색상
    frame_colors TEXT[] := ARRAY['실버', '화이트', '골드', '블랙'];
    frame_color_codes TEXT[] := ARRAY['SV', 'WH', 'GD', 'BK'];

    -- 상판 색상
    panel_colors TEXT[] := ARRAY['화이트오크', '메이플', '월넛', '화이트'];
    panel_color_codes TEXT[] := ARRAY['WO', 'MP', 'WN', 'WH'];

    -- 서랍장 색상
    drawer_colors TEXT[] := ARRAY['화이트', '웜그레이', '오크'];
    drawer_color_codes TEXT[] := ARRAY['WH', 'WG', 'OK'];

    -- 앵글 시스템 규격 (드레스룸)
    angle_depths INT[] := ARRAY[300, 400, 500, 600];
    angle_widths INT[] := ARRAY[300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500];

    -- 시스템장 규격 (깊이 400 고정)
    system_widths INT[] := ARRAY[300, 400, 450, 500, 600, 700, 800, 900];

    i INT;
    j INT;
    k INT;
    test_user_id UUID;
BEGIN
    -- 첫 번째 사용자 ID 가져오기
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No users found. Skipping seed.';
        RETURN;
    END IF;

    -- =============================================
    -- 1. 앵글 프레임 (드레스룸) - 색상 x 깊이 x 가로
    -- =============================================
    FOR i IN 1..array_length(frame_colors, 1) LOOP
        FOR j IN 1..array_length(angle_depths, 1) LOOP
            FOR k IN 1..array_length(angle_widths, 1) LOOP
                INSERT INTO products (user_id, name, category, sku, unit, unit_price, min_stock, width, depth, color, memo, is_active)
                VALUES (
                    test_user_id,
                    '앵글프레임 ' || frame_colors[i] || ' ' || angle_widths[k] || 'x' || angle_depths[j],
                    'angle_frame',
                    'AF-' || frame_color_codes[i] || '-' || angle_widths[k] || '-' || angle_depths[j],
                    'EA',
                    0,
                    3,
                    angle_widths[k],
                    angle_depths[j],
                    frame_colors[i],
                    '드레스룸용 앵글 프레임',
                    true
                )
                ON CONFLICT (user_id, sku) DO UPDATE SET
                    width = EXCLUDED.width,
                    depth = EXCLUDED.depth,
                    color = EXCLUDED.color;
            END LOOP;
        END LOOP;
    END LOOP;

    -- =============================================
    -- 2. 시스템 프레임 (시스템장) - 색상 x 가로 (깊이 400 고정)
    -- =============================================
    FOR i IN 1..array_length(frame_colors, 1) LOOP
        FOR j IN 1..array_length(system_widths, 1) LOOP
            INSERT INTO products (user_id, name, category, sku, unit, unit_price, min_stock, width, depth, color, memo, is_active)
            VALUES (
                test_user_id,
                '시스템프레임 ' || frame_colors[i] || ' ' || system_widths[j] || 'x400',
                'system_frame',
                'SF-' || frame_color_codes[i] || '-' || system_widths[j],
                'EA',
                0,
                5,
                system_widths[j],
                400,
                frame_colors[i],
                '시스템장용 프레임, 깊이 400mm 고정',
                true
            )
            ON CONFLICT (user_id, sku) DO UPDATE SET
                width = EXCLUDED.width,
                depth = EXCLUDED.depth,
                color = EXCLUDED.color;
        END LOOP;
    END LOOP;

    -- =============================================
    -- 3. 상판 - 색상 x 가로 (깊이 400 고정)
    -- =============================================
    FOR i IN 1..array_length(panel_colors, 1) LOOP
        FOR j IN 1..array_length(system_widths, 1) LOOP
            INSERT INTO products (user_id, name, category, sku, unit, unit_price, min_stock, width, depth, color, memo, is_active)
            VALUES (
                test_user_id,
                '상판 ' || panel_colors[i] || ' ' || system_widths[j] || 'x400',
                'top_panel',
                'TP-' || panel_color_codes[i] || '-' || system_widths[j],
                'EA',
                0,
                3,
                system_widths[j],
                400,
                panel_colors[i],
                '상판, 깊이 400mm 고정',
                true
            )
            ON CONFLICT (user_id, sku) DO UPDATE SET
                width = EXCLUDED.width,
                depth = EXCLUDED.depth,
                color = EXCLUDED.color;
        END LOOP;
    END LOOP;

    -- =============================================
    -- 4. 선반 - 색상 x 가로 (깊이 400 고정)
    -- =============================================
    FOR i IN 1..array_length(panel_colors, 1) LOOP
        FOR j IN 1..array_length(system_widths, 1) LOOP
            INSERT INTO products (user_id, name, category, sku, unit, unit_price, min_stock, width, depth, color, memo, is_active)
            VALUES (
                test_user_id,
                '선반 ' || panel_colors[i] || ' ' || system_widths[j] || 'x400',
                'shelf',
                'SH-' || panel_color_codes[i] || '-' || system_widths[j],
                'EA',
                0,
                3,
                system_widths[j],
                400,
                panel_colors[i],
                '선반, 깊이 400mm 고정',
                true
            )
            ON CONFLICT (user_id, sku) DO UPDATE SET
                width = EXCLUDED.width,
                depth = EXCLUDED.depth,
                color = EXCLUDED.color;
        END LOOP;
    END LOOP;

    -- =============================================
    -- 5. 서랍장 (2단, 3단, 4단, 5단) - 색상별
    -- =============================================
    FOR i IN 1..array_length(drawer_colors, 1) LOOP
        -- 미니 서랍장 3단
        INSERT INTO products (user_id, name, category, sku, unit, unit_price, min_stock, width, color, memo, is_active)
        VALUES (
            test_user_id,
            '미니서랍장 3단 ' || drawer_colors[i],
            'drawer',
            'DR-3M-' || drawer_color_codes[i],
            'EA', 0, 2, 600, drawer_colors[i], '소품/액세서리용', true
        )
        ON CONFLICT (user_id, sku) DO UPDATE SET width = EXCLUDED.width, color = EXCLUDED.color;

        -- 기본 서랍장 4단
        INSERT INTO products (user_id, name, category, sku, unit, unit_price, min_stock, width, color, memo, is_active)
        VALUES (
            test_user_id,
            '서랍장 4단 ' || drawer_colors[i],
            'drawer',
            'DR-4D-' || drawer_color_codes[i],
            'EA', 0, 3, 800, drawer_colors[i], '속옷/양말용', true
        )
        ON CONFLICT (user_id, sku) DO UPDATE SET width = EXCLUDED.width, color = EXCLUDED.color;

        -- 대형 서랍장 5단
        INSERT INTO products (user_id, name, category, sku, unit, unit_price, min_stock, width, color, memo, is_active)
        VALUES (
            test_user_id,
            '서랍장 5단 ' || drawer_colors[i],
            'drawer',
            'DR-5D-' || drawer_color_codes[i],
            'EA', 0, 2, 800, drawer_colors[i], '일반의류용', true
        )
        ON CONFLICT (user_id, sku) DO UPDATE SET width = EXCLUDED.width, color = EXCLUDED.color;

        -- 와이드 서랍장 4단
        INSERT INTO products (user_id, name, category, sku, unit, unit_price, min_stock, width, color, memo, is_active)
        VALUES (
            test_user_id,
            '와이드서랍장 4단 ' || drawer_colors[i],
            'drawer',
            'DR-4W-' || drawer_color_codes[i],
            'EA', 0, 2, 1000, drawer_colors[i], '넓은 수납용', true
        )
        ON CONFLICT (user_id, sku) DO UPDATE SET width = EXCLUDED.width, color = EXCLUDED.color;
    END LOOP;

    -- =============================================
    -- 6. 거울/거울장
    -- =============================================
    INSERT INTO products (user_id, name, category, sku, unit, unit_price, min_stock, width, memo, is_active)
    VALUES
        (test_user_id, '거울장 400', 'mirror', 'MR-400', 'EA', 0, 2, 400, '전신거울장 가로 400mm', true),
        (test_user_id, '거울장 500', 'mirror', 'MR-500', 'EA', 0, 2, 500, '전신거울장 가로 500mm', true),
        (test_user_id, '반신거울', 'mirror', 'MR-HALF', 'EA', 0, 2, NULL, '반신거울', true)
    ON CONFLICT (user_id, sku) DO NOTHING;

    -- =============================================
    -- 7. 행거봉 (너비별)
    -- =============================================
    FOR j IN 1..array_length(system_widths, 1) LOOP
        INSERT INTO products (user_id, name, category, sku, unit, unit_price, min_stock, width, memo, is_active)
        VALUES (
            test_user_id,
            '행거봉 ' || system_widths[j],
            'hanger_bar',
            'HB-' || system_widths[j],
            'EA', 0, 5, system_widths[j], '너비 ' || system_widths[j] || 'mm', true
        )
        ON CONFLICT (user_id, sku) DO UPDATE SET width = EXCLUDED.width;
    END LOOP;

    -- =============================================
    -- 8. 조명 (LED 바)
    -- =============================================
    INSERT INTO products (user_id, name, category, sku, unit, unit_price, min_stock, memo, is_active)
    VALUES
        (test_user_id, 'LED 바 조명 600', 'lighting', 'LED-600', 'EA', 0, 3, '600mm LED 바', true),
        (test_user_id, 'LED 바 조명 900', 'lighting', 'LED-900', 'EA', 0, 3, '900mm LED 바', true),
        (test_user_id, 'LED 바 조명 1200', 'lighting', 'LED-1200', 'EA', 0, 3, '1200mm LED 바', true)
    ON CONFLICT (user_id, sku) DO NOTHING;

    -- =============================================
    -- 9. 트레이/칸막이
    -- =============================================
    INSERT INTO products (user_id, name, category, sku, unit, unit_price, min_stock, memo, is_active)
    VALUES
        (test_user_id, '칸막이 트레이 소', 'tray', 'TR-S', 'EA', 0, 5, '서랍 내부 정리용 소형', true),
        (test_user_id, '칸막이 트레이 중', 'tray', 'TR-M', 'EA', 0, 5, '서랍 내부 정리용 중형', true),
        (test_user_id, '칸막이 트레이 대', 'tray', 'TR-L', 'EA', 0, 5, '서랍 내부 정리용 대형', true)
    ON CONFLICT (user_id, sku) DO NOTHING;

    -- =============================================
    -- 10. 액세서리
    -- =============================================
    INSERT INTO products (user_id, name, category, sku, unit, unit_price, min_stock, memo, is_active)
    VALUES
        (test_user_id, '바지걸이 슬라이딩', 'accessory', 'ACC-PANTS', 'EA', 0, 3, '슬라이딩 타입 바지걸이', true),
        (test_user_id, '넥타이걸이', 'accessory', 'ACC-TIE', 'EA', 0, 3, '넥타이/벨트 정리용', true),
        (test_user_id, '벨트걸이', 'accessory', 'ACC-BELT', 'EA', 0, 3, '벨트 전용 걸이', true),
        (test_user_id, '가방걸이', 'accessory', 'ACC-BAG', 'EA', 0, 2, '가방 수납용 걸이', true)
    ON CONFLICT (user_id, sku) DO NOTHING;

    -- =============================================
    -- 11. 하드웨어
    -- =============================================
    INSERT INTO products (user_id, name, category, sku, unit, unit_price, min_stock, memo, is_active)
    VALUES
        (test_user_id, '경첩 세트', 'hardware', 'HW-HINGE', 'SET', 0, 10, '문짝용 경첩 세트', true),
        (test_user_id, '손잡이', 'hardware', 'HW-HANDLE', 'EA', 0, 10, '서랍/문짝용 손잡이', true),
        (test_user_id, '레일 세트', 'hardware', 'HW-RAIL', 'SET', 0, 5, '서랍 레일 세트', true)
    ON CONFLICT (user_id, sku) DO NOTHING;

    RAISE NOTICE 'Full product catalog seeded for user: %', test_user_id;
END $$;
