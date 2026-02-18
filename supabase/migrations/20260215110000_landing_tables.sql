-- 견적 요청 테이블
CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 고객 정보
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,

  -- 요청 정보
  category TEXT NOT NULL CHECK (category IN ('angle', 'curtain', 'system')),
  address TEXT,
  description TEXT,

  -- 상태 관리
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'quoted', 'completed', 'cancelled')),
  admin_notes TEXT,

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contacted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 포트폴리오 테이블
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 정보
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('angle', 'curtain', 'system')),

  -- 이미지
  images TEXT[] NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,

  -- 연결된 주문 (선택적)
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

  -- 표시 설정
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_quote_requests_status ON quote_requests(status);
CREATE INDEX idx_quote_requests_created_at ON quote_requests(created_at DESC);
CREATE INDEX idx_portfolios_category ON portfolios(category);
CREATE INDEX idx_portfolios_is_visible ON portfolios(is_visible);
CREATE INDEX idx_portfolios_display_order ON portfolios(display_order);

-- RLS 정책
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- 견적 요청: 누구나 생성 가능, 인증된 사용자만 조회/수정
CREATE POLICY "Anyone can create quote requests" ON quote_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view quote requests" ON quote_requests
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update quote requests" ON quote_requests
  FOR UPDATE TO authenticated
  USING (true);

-- 포트폴리오: 공개된 항목은 누구나 조회, 인증된 사용자만 전체 관리
CREATE POLICY "Anyone can view visible portfolios" ON portfolios
  FOR SELECT TO anon, authenticated
  USING (is_visible = true OR (SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can manage portfolios" ON portfolios
  FOR ALL TO authenticated
  USING (true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quote_requests_updated_at
  BEFORE UPDATE ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
