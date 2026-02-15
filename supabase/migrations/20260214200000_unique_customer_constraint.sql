-- 고객 중복 방지: 같은 사용자의 동일 이름+전화번호 중복 불가
-- phone이 NULL인 경우도 고려하여 COALESCE 사용

-- 기존 중복 데이터 정리 (가장 오래된 것만 유지)
DELETE FROM customers
WHERE id NOT IN (
  SELECT MIN(id)
  FROM customers
  GROUP BY user_id, name, COALESCE(phone, '')
);

-- 유니크 제약 추가
ALTER TABLE customers
ADD CONSTRAINT customers_user_name_phone_unique
UNIQUE (user_id, name, phone);

-- 부분 인덱스: phone이 NULL인 경우 처리
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_user_name_no_phone
ON customers (user_id, name)
WHERE phone IS NULL;

COMMENT ON CONSTRAINT customers_user_name_phone_unique ON customers
IS '동일 사용자의 이름+전화번호 중복 방지';
