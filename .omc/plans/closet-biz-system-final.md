# ClosetBiz - 앵글/시스템 옷장 1인 회사 업무 관리 시스템 (최종 확정본)

> **문서 버전**: FINAL v1.0
> **통합 기준**: 기존 계획서 + 7개 트랙 검증 결과 + 다크모드/다중뷰 UX 설계
> **최종 확정일**: 2026-02-14

---

## 1. 프로젝트 개요

### 프로젝트명
**ClosetBiz** (클로젯비즈)

### 목표
앵글/시스템 옷장 설치 1인 사업자의 수작업 업무 프로세스를 디지털화하여 수주-발주-재고-매출 전 과정을 하나의 시스템으로 통합 관리한다. 현장 이동이 잦은 업무 특성에 맞춰 모바일 친화적 PWA로 구축하며, 견적/리포트 자동 생성 및 2D/3D 모델링을 통한 고객 마케팅 도구까지 포함한다.

### 타겟 사용자
- **주 사용자**: 1인 앵글/시스템 옷장 설치 사업자 (관리자 겸 현장 작업자)
- **부 사용자**: 고객 (견적서/완성 예상도를 열람하는 용도, 읽기 전용)

### 핵심 가치
| 가치 | 설명 |
|------|------|
| **원스톱 관리** | 수주~매출, 발주~매입 전 과정을 하나의 앱에서 |
| **현장 중심 UX** | 한 손으로 조작 가능한 심플한 모바일 UI, 장갑 착용 대응 |
| **자동 리포팅** | 체크리스트 기반 견적/준비 확인, PDF 생성 |
| **시각적 마케팅** | 2D/3D 옷장 모델링으로 고객 제안력 강화 |
| **다크모드 지원** | Industrial Precision 미학, 현장/사무실 최적화 |

---

## 2. 기술 스택 결정

### Frontend: Next.js 15 App Router + PWA

**선정 근거:**
- App Router의 서버 컴포넌트로 초기 로딩 속도 최적화
- React 생태계의 풍부한 UI 컴포넌트 라이브러리 활용
- Vercel 배포 시 CDN 자동 적용

**PWA 전략:**
- Next.js 15는 PWA를 네이티브로 지원하지 않으므로, `@serwist/next`를 활용하여 Service Worker 관리 (오프라인 캐싱, 백그라운드 싱크)
- manifest.ts로 동적 매니페스트 생성
- 홈 화면 추가(A2HS) 프롬프트 구현
- **Phase 1 오프라인 범위**: 읽기 전용 앱 셸 캐싱만 지원. 오프라인 상태에서 데이터 쓰기/동기화는 지원하지 않음. 네트워크 미연결 시 "오프라인 모드" 배너 표시 및 캐시된 앱 셸만 제공

**UI 프레임워크:**
- **shadcn/ui** + **Tailwind CSS v4**: 커스터마이징이 자유로운 컴포넌트 시스템
- **Radix UI**: shadcn/ui 기반 접근성 보장
- **Lucide Icons**: 경량 아이콘 세트

### Backend: Supabase

**적합성 분석:**

| 항목 | Supabase 장점 | 주의점 |
|------|---------------|--------|
| **개발 속도** | Auth, DB, Storage, Realtime 올인원 | - |
| **비용** | Free Tier로 MVP 충분 (500MB DB, 1GB Storage) | 스케일 시 Pro $25/월 |
| **SQL 기반** | 복잡한 비즈니스 쿼리에 적합 (재고, 정산) | SQL 지식 필요 |
| **RLS** | Row Level Security로 세밀한 권한 관리 | 초기 설정 복잡 |
| **Edge Functions** | 서버리스 로직 (PDF 생성, 알림) | Cold start 이슈 |
| **Realtime** | 재고 변동 실시간 반영 | 1인 사용이라 필수는 아님 |
| **RPC Functions** | PostgreSQL function으로 트랜잭션 원자성 보장 | SQL function 작성 필요 |

**결론**: Supabase 채택. PostgreSQL 기반으로 복잡한 재고/정산 쿼리에 적합하며, RPC function으로 트랜잭션 원자성을 보장할 수 있고, 1인 사업자의 Free Tier 시작 -> Pro 업그레이드 경로가 합리적.

### 2D/3D 모델링 라이브러리 [Track E 반영: Three.js 단일 라이브러리 전환]

**Three.js 단일 라이브러리 방식 (2D + 3D 통합):**
- **React Three Fiber** (@react-three/fiber) + **@react-three/drei**: 2D/3D 모두 단일 Three.js 씬으로 처리
- **2D 모드**: `OrthographicCamera`로 평면도 뷰 (위에서 내려다보는 시점)
- **3D 모드**: `PerspectiveCamera`로 입체 뷰 (회전/줌 자유)
- 카메라 전환만으로 2D/3D 모드 스위칭 (동기화 로직 불필요, 같은 씬 데이터)
- 번들 크기 최소 (~170KB for three.js)
- 치수 표시: CSS2DRenderer 또는 @react-three/drei의 Html 컴포넌트
- 스냅 그리드: `Math.round(x / gridSize) * gridSize`

**이전 방식 대비 장점:**
- Konva.js(2D) + R3F(3D) 분리형 대비 동기화 복잡성 제거
- 의존성 2개 제거 (konva, react-konva)
- 단일 씬 데이터로 2D/3D 간 데이터 불일치 원천 차단

### 주요 의존성 목록 [Track C, E 반영: 교체/추가/제거]

```
# Core
next@15.x                    # 프레임워크
react@19.x                   # UI 라이브러리
typescript@5.x               # 타입 안전성

# Backend
@supabase/supabase-js@2.x    # Supabase 클라이언트
@supabase/ssr                # SSR용 Auth 헬퍼
                             # [주의] getUser() 사용 필수 (getSession이 아님) - 보안

# UI
tailwindcss@4.x              # 스타일링
@radix-ui/*                  # 접근성 컴포넌트
lucide-react                 # 아이콘
tw-animate-css               # 애니메이션 (Tailwind v4 CSS-first)

# Drag & Drop [Track C: 교체 → 신규 @dnd-kit/react]
@dnd-kit/react               # 칸반 드래그앤드롭 (core/sortable/utilities 통합 후속)
@dnd-kit/dom                 # DOM 전용 센서/플러그인
# (교체됨: @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities → @dnd-kit/react로 통합)
# [주의] Next.js Server Component에서 직접 사용 불가 → "use client" 래퍼 필수

# Calendar
@schedule-x/react            # 캘린더 UI
                             # [주의] 한국어 locale 테스트 필요

# PWA
@serwist/next                # Service Worker 관리
web-push                     # 푸시 알림 (선택)

# 2D/3D Modeling (Three.js 단일 라이브러리) [Track E: 통합]
@react-three/fiber           # React Three.js 렌더러
@react-three/drei            # 유틸리티 (Html, OrbitControls 등)
three                        # 3D 엔진
# (제거됨: konva, react-konva - Three.js로 통합)

# Fonts [Track F: 변경 - Pretendard + Inter 조합]
pretendard                            # 한글 + 영문 기본 폰트 (Inter 기반)
@fontsource-variable/inter            # 영문 fallback
@fontsource-variable/jetbrains-mono   # Monospace 폰트 (숫자)

# PDF [Track C: 서버사이드 전용]
@react-pdf/renderer@4.x      # React 기반 PDF 생성 (한글 품질 우수)
# [주의] React 19 클라이언트 호환 불완전 → Route Handler/Edge Function에서만 사용
# [주의] 설치 시 --legacy-peer-deps 필요할 수 있음

# Charts
recharts@3.x                 # 차트 라이브러리
# [주의] react-is 오버라이드 필요: package.json overrides에 "react-is": "^19.0.0" 추가

# Utilities
date-fns                     # 날짜 처리 (ko locale)
zod                          # 스키마 검증
react-hook-form              # 폼 관리
@tanstack/react-query        # 서버 상태 관리

# Dev
eslint                       # 린팅
prettier                     # 포매팅
supabase                     # CLI (로컬 개발)

# Testing
vitest                       # 단위/통합 테스트
@testing-library/react       # 컴포넌트 테스트
playwright                   # E2E 테스트
```

### 기술 스택 주의사항 [Track C 반영]

| 라이브러리 | 주의사항 | 대응 방안 |
|------------|----------|-----------|
| `@supabase/ssr` | `getSession()`은 클라이언트 JWT를 검증 없이 반환하므로 보안 취약 | **반드시 `getUser()`** 사용. 서버 컴포넌트/미들웨어에서 인증 확인 시 `getUser()` 호출 |
| `@schedule-x/react` | 한국어 locale 공식 지원 미확인 | 설치 후 즉시 한국어 locale 테스트. 미지원 시 커스텀 locale 파일 작성 |
| `recharts@3.x` | `react-is` 의존성 충돌 | package.json에 `"overrides": { "react-is": "^19.0.0" }` 추가 |
| `@react-three/fiber` | Next.js SSR에서 window 미정의 에러 | `next/dynamic`으로 동적 임포트 (ssr: false). `next.config.js`에 three externals 설정 |
| `@react-pdf/renderer@4.x` | React 19 클라이언트 호환 불완전. 한글 폰트 번들 필요 | **Route Handler/Edge Function에서만 사용** (클라이언트 렌더링 금지). Pretendard 폰트 등록. `--legacy-peer-deps` 설치 옵션 필요 시 사용 |
| `@dnd-kit/react` | Next.js Server Component 비호환 | `"use client"` 래퍼 컴포넌트로 DragDropProvider 감싸서 사용. `@dnd-kit/core`는 레거시이므로 `@dnd-kit/react` 사용 |

**next.config.js 필수 설정:**
```javascript
// Three.js SSR 방지
const nextConfig = {
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};
```

---

## 3. 시스템 아키텍처

### 전체 아키텍처

```
+------------------------------------------------------------------+
|                        사용자 디바이스                              |
|  +---------------+  +---------------+  +---------------------+   |
|  | 모바일 (PWA)  |  | 태블릿 (PWA)  |  | 데스크탑 (브라우저)   |   |
|  +-------+-------+  +-------+-------+  +-----------+---------+   |
|          |                  |                       |             |
|          +------------------+-----------------------+             |
|                             |                                    |
|              Service Worker (앱 셸 캐싱, 읽기 전용)               |
+-----------------------------+------------------------------------+
                              | HTTPS
+-----------------------------+------------------------------------+
|                     Next.js 15 App                                |
|  +------------------------------------------------------------+  |
|  |              App Router (RSC + Client)                      |  |
|  |  +---------+ +----------+ +----------+ +-------------+     |  |
|  |  | 수주관리 | | 발주관리  | | 재고관리  | | 스케줄관리   |     |  |
|  |  +---------+ +----------+ +----------+ +-------------+     |  |
|  |  +---------+ +----------+ +----------+                     |  |
|  |  | 매출관리 | | 리포팅   | | 2D/3D    |                     |  |
|  |  +---------+ +----------+ +----------+                     |  |
|  +------------------------------------------------------------+  |
|  +------------------------------------------------------------+  |
|  |              Server Actions / API Routes                    |  |
|  |  +----------+ +----------+ +----------+ +------------+     |  |
|  |  | CRUD API | | PDF 생성 | | 통계집계  | | 파일 업로드 |     |  |
|  |  +----------+ +----------+ +----------+ +------------+     |  |
|  +------------------------------------------------------------+  |
+-----------------------------+------------------------------------+
                              |
+-----------------------------+------------------------------------+
|                       Supabase                                    |
|  +----------+ +----------+ +----------+ +------------------+     |
|  | Auth     | | Postgres | | Storage  | | Edge Functions   |     |
|  | (인증)   | | (DB/RLS) | | (파일)   | | (PDF, 알림)      |     |
|  +----------+ +----------+ +----------+ +------------------+     |
|  +------------------------------------------------------------+  |
|  |              RPC Functions (트랜잭션 원자성)                  |  |
|  |  +--------------------+ +----------------------------+      |  |
|  |  | hold_materials     | | dispatch_materials          |      |  |
|  |  | _for_order         | | _for_order                  |      |  |
|  |  +--------------------+ +----------------------------+      |  |
|  |  +--------------------+                                     |  |
|  |  | release_held       |                                     |  |
|  |  | _materials         |                                     |  |
|  |  +--------------------+                                     |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
                              |
+-----------------------------+------------------------------------+
|                     배포 인프라                                    |
|  +--------------+  +--------------+                               |
|  | Vercel       |  | Supabase     |                               |
|  | (프론트엔드)  |  | (백엔드)      |                               |
|  +--------------+  +--------------+                               |
+------------------------------------------------------------------+
```

### DB 스키마 설계 [Track B, G 반영: 인덱스/제약조건/트리거/신규 테이블 추가]

```sql
-- ============================================================
-- 0. 공통: updated_at 자동 갱신 트리거 [Track B 추가]
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- (각 테이블에 트리거 적용 - 아래 테이블 생성 후)

-- ============================================================
-- 1. 고객 (customers)
-- ============================================================
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

-- ============================================================
-- 2. 수주 (orders) - Main Flow 핵심
-- ============================================================
CREATE TYPE order_status AS ENUM (
  'inquiry',           -- 고객전화(의뢰)
  'quotation_sent',    -- 전화회신(견적)
  'confirmed',         -- 전화요청(수주)
  'measurement_done',  -- 방문 실측 완료
  'date_fixed',        -- 현장 장문일자 확정
  'material_held',     -- 설치 선반 옷장 사전 준비(재료 hold)
  'installed',         -- 현장 설치(재고 불출)
  'settlement_wait',   -- 정산대기
  'revenue_confirmed', -- 매출확정
  'cancelled'          -- 취소
);

CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,        -- 자동 채번 (CB-2026-0001)
  status order_status DEFAULT 'inquiry',

  -- 견적 정보
  quotation_amount BIGINT DEFAULT 0,
  confirmed_amount BIGINT DEFAULT 0,

  -- 옷장 정보
  closet_type TEXT,                          -- 앵글/시스템/혼합
  closet_spec JSONB DEFAULT '{}',

  -- 일정
  measurement_date DATE,
  installation_date DATE,

  -- 현장 정보
  site_address TEXT,
  site_photos TEXT[],
  site_memo TEXT,

  -- 체크리스트
  preparation_checklist JSONB DEFAULT '[]',
  installation_checklist JSONB DEFAULT '[]',

  -- 2D/3D 모델 참조 [Track E: 통합 씬 데이터]
  model_scene_data JSONB,                    -- Three.js 통합 씬 데이터 (2D/3D 공유)

  -- 정산
  payment_method TEXT,
  payment_date DATE,

  -- 매출/매입 확정 [Track G Critical 추가]
  -- [M7] Single Source of Truth: revenue_records/cost_records가 원본.
  -- 아래 필드는 조회 성능을 위한 비정규화 캐시 (RPC에서 자동 갱신)
  revenue_confirmed_at TIMESTAMPTZ,          -- 매출 확정 일시 (revenue_records에서 동기화)
  cost_confirmed_at TIMESTAMPTZ,             -- 매입 확정 일시 (cost_records에서 동기화)

  -- 취소 정보
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_from_status order_status,

  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 수주 채번 함수
-- [M8] 시퀀스 대신 MAX+1 방식으로 연도별 자동 리셋
-- 1인 사용자이므로 동시성 문제 없음. 다중 사용자 시 ADVISORY LOCK 추가 필요
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

-- ============================================================
-- closet_spec JSONB 스키마 정의 (Zod로 프론트에서 검증)
-- ============================================================
-- {
--   width: number (mm),
--   height: number (mm),
--   depth: number (mm),
--   sections: [{
--     type: "shelf" | "hanger" | "drawer" | "open",
--     width: number (mm),
--     position: { x: number, y: number },
--     shelves_count?: number,
--     hanger_bar_count?: number,
--     drawer_count?: number
--   }],
--   frame_type: "angle" | "system" | "mixed",
--   color?: string,
--   material?: string,
--   door_type?: "none" | "sliding" | "hinged",
--   notes?: string
-- }

-- ============================================================
-- 3. 자재/제품 (products)
-- ============================================================
CREATE TYPE product_category AS ENUM (
  'angle_frame', 'system_frame', 'shelf', 'hanger_bar',
  'drawer', 'door', 'hardware', 'accessory', 'etc'
);

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
  -- [M9] SKU 유일성은 사용자 단위로 적용
  UNIQUE(user_id, sku)
);

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. 재고 (inventory) [Track B: CHECK 제약조건 추가]
-- ============================================================
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
  -- [C4] held_quantity는 quantity를 초과할 수 없음
  CONSTRAINT chk_inventory_held_le_quantity CHECK (held_quantity <= quantity)
);

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. 발주 (purchase_orders)
-- ============================================================
CREATE TYPE po_status AS ENUM (
  'draft', 'ordered', 'received', 'settled', 'cost_confirmed'
);

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

-- [M8] PO도 동일하게 MAX+1 방식 적용
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

-- ============================================================
-- 6. 발주 항목 (purchase_order_items) [Track B: CHECK 제약조건 추가]
-- ============================================================
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
  -- [Track B] 입고 수량이 발주 수량을 초과하지 못하도록
  CONSTRAINT chk_poi_received_le_quantity CHECK (received_quantity <= quantity)
);

-- ============================================================
-- 7. 수주별 자재 사용 (order_materials)
-- ============================================================
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

-- ============================================================
-- 8. 재고 변동 이력 (inventory_transactions)
-- ============================================================
CREATE TYPE transaction_type AS ENUM (
  'inbound', 'outbound', 'hold', 'release_hold', 'adjustment'
);

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

-- ============================================================
-- 9. 스케줄 (schedules) [Track G: is_active 필드 추가]
-- ============================================================
CREATE TYPE schedule_type AS ENUM (
  'measurement', 'installation', 'visit', 'delivery', 'other'
);

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
  is_active BOOLEAN DEFAULT TRUE,             -- [Track G] 수주 취소 시 비활성화
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. 리포트 템플릿 (report_templates)
-- ============================================================
CREATE TABLE report_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  template_data JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. 생성된 리포트 (generated_reports)
-- ============================================================
CREATE TABLE generated_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  report_data JSONB NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ⚠ Phase 2 테이블: Phase 1 마이그레이션에 포함하지 않음
-- 아래 테이블들은 Phase 2에서 별도 마이그레이션으로 생성
-- ============================================================

-- ============================================================
-- 12. 수주-발주 배분 (purchase_order_allocations) - Phase 2
-- ============================================================
CREATE TABLE purchase_order_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  purchase_order_item_id UUID REFERENCES purchase_order_items(id) ON DELETE CASCADE,
  allocated_quantity INT NOT NULL,
  allocated_amount BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, purchase_order_item_id)
);

-- ============================================================
-- 13. 옷장 부품 프리셋 (closet_component_presets) - Phase 2
-- ============================================================
CREATE TABLE closet_component_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  name TEXT NOT NULL,
  category product_category NOT NULL,
  preset_data JSONB NOT NULL,
  thumbnail_url TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. 매출 확정 기록 (revenue_records) [Track G Critical 추가]
-- 수주와 독립적으로 매출 확정을 추적
-- ============================================================
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

-- ============================================================
-- 15. 매입 확정 기록 (cost_records) [Track G Critical 추가]
-- 발주와 독립적으로 매입 확정을 추적
-- ============================================================
CREATE TABLE cost_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,  -- 관련 수주 (optional)
  confirmed_amount BIGINT NOT NULL,
  payment_method TEXT,
  payment_date DATE,
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 인덱스 [Track B 반영: FK 컬럼 인덱스 ~15개 추가]
-- ============================================================
-- 기존 인덱스
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_installation_date ON orders(installation_date);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_user ON inventory(user_id);
CREATE INDEX idx_schedules_date ON schedules(scheduled_date);
CREATE INDEX idx_schedules_order ON schedules(order_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_user ON purchase_orders(user_id);
CREATE INDEX idx_customers_user ON customers(user_id);
CREATE INDEX idx_products_user ON products(user_id);
CREATE INDEX idx_po_allocations_order ON purchase_order_allocations(order_id);
CREATE INDEX idx_po_allocations_po ON purchase_order_allocations(purchase_order_id);

-- [Track B 추가] FK 컬럼 인덱스
CREATE INDEX idx_orders_measurement_date ON orders(measurement_date);
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
CREATE INDEX idx_po_alloc_item ON purchase_order_allocations(purchase_order_item_id);

-- [Track G 추가] 매출/매입 기록 인덱스
CREATE INDEX idx_revenue_records_order ON revenue_records(order_id);
CREATE INDEX idx_revenue_records_user ON revenue_records(user_id);
CREATE INDEX idx_revenue_records_date ON revenue_records(confirmed_at);
CREATE INDEX idx_cost_records_po ON cost_records(purchase_order_id);
CREATE INDEX idx_cost_records_order ON cost_records(order_id);
CREATE INDEX idx_cost_records_user ON cost_records(user_id);
CREATE INDEX idx_cost_records_date ON cost_records(confirmed_at);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE closet_component_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_records ENABLE ROW LEVEL SECURITY;

-- user_id = auth.uid() 기반 정책
CREATE POLICY "Users can manage own data" ON customers
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own data" ON orders
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own data" ON products
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own data" ON inventory
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own data" ON inventory_transactions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own data" ON purchase_orders
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own data" ON purchase_order_items
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own data" ON order_materials
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own data" ON schedules
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own data" ON generated_reports
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own data" ON purchase_order_allocations
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own data" ON revenue_records
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own data" ON cost_records
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own presets" ON closet_component_presets
  FOR ALL USING (user_id = auth.uid() OR is_system = TRUE) WITH CHECK (user_id = auth.uid());

-- report_templates: 본인 것 + 시스템 기본 템플릿 접근 허용
CREATE POLICY "Users can manage own templates and view defaults" ON report_templates
  FOR SELECT USING (user_id = auth.uid() OR is_default = TRUE);
CREATE POLICY "Users can insert own templates" ON report_templates
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own templates" ON report_templates
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own templates" ON report_templates
  FOR DELETE USING (user_id = auth.uid());
```

### RPC Functions (트랜잭션 원자성 보장)

```sql
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
  -- [C5] 소유권 검증
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
  -- [C5] 소유권 검증
  IF NOT EXISTS (SELECT 1 FROM orders WHERE id = p_order_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: order % does not belong to current user', p_order_id;
  END IF;

  -- [M5] 주문 상태 검증: material_held 상태에서만 출고 가능
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
  -- [C5] 소유권 검증
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
-- RPC 4: cancel_order_cascade [Track G Critical 추가]
-- 수주 취소 시 연쇄 처리
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

  -- [C5] 소유권 검증
  IF v_order.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: order % does not belong to current user', p_order_id;
  END IF;

  IF v_order.status IN ('installed', 'settlement_wait', 'revenue_confirmed', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot cancel order in status: %', v_order.status;
  END IF;

  -- [C6] 자재 hold 해제: 모든 취소 가능 상태에서 held_quantity > 0인 자재가 있으면 반환
  -- (material_held뿐 아니라 date_fixed 등에서도 부분 hold가 존재할 수 있음)
  v_release_result := release_held_materials(p_order_id);

  -- 2. 스케줄 비활성화 [Track G Critical #3]
  UPDATE schedules
  SET is_active = FALSE
  WHERE order_id = p_order_id AND is_active = TRUE;

  -- 3. draft 발주 배분 해제 [Track G Important #8, M6: 공유 PO 보호]
  -- 이 주문에 연결된 배분만 삭제 (PO 자체는 다른 주문이 사용할 수 있으므로 삭제하지 않음)
  DELETE FROM purchase_order_allocations
  WHERE order_id = p_order_id;

  -- 배분이 모두 제거된 draft PO의 아이템 수량 재계산은 앱 레벨에서 처리
  -- (PO에 연결된 다른 주문이 없는 경우에만 PO 삭제 가능)

  -- 4. 수주 상태 업데이트
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

-- ============================================================
-- RPC 5: confirm_revenue (매출 확정) [M10 추가]
-- ============================================================
-- 구현 예정: 주문의 매출을 확정하고 revenue_records에 기록
-- 입력: p_order_id UUID, p_amount BIGINT, p_payment_method TEXT, p_payment_date DATE
-- 동작:
--   1. 소유권 검증 (auth.uid())
--   2. 주문 상태가 settlement_wait인지 확인
--   3. revenue_records에 INSERT
--   4. orders.revenue_confirmed_at 갱신
--   5. orders.status를 revenue_confirmed로 전이
-- Phase 1 Sprint 4에서 구현

-- ============================================================
-- RPC 6: receive_purchase_order (입고 처리) [M10 추가]
-- ============================================================
-- 구현 예정: 발주의 입고를 처리하고 재고에 반영
-- 입력: p_po_id UUID, p_items JSONB (product_id, received_quantity 배열)
-- 동작:
--   1. 소유권 검증 (auth.uid())
--   2. PO 상태가 ordered인지 확인
--   3. purchase_order_items.received_quantity 갱신
--   4. inventory.quantity 증가
--   5. inventory_transactions에 inbound 기록
--   6. 모든 아이템 입고 완료 시 PO 상태를 received로 전이
-- Phase 1 Sprint 3에서 구현

-- ============================================================
-- RPC 7: adjust_inventory (재고 조정) [M10 추가]
-- ============================================================
-- 구현 예정: 수동 재고 조정 (실사, 파손 등)
-- 입력: p_product_id UUID, p_new_quantity INT, p_reason TEXT
-- 동작:
--   1. 소유권 검증 (auth.uid())
--   2. held_quantity <= p_new_quantity 검증
--   3. inventory.quantity 갱신
--   4. inventory_transactions에 adjustment 기록
-- Phase 1 Sprint 3에서 구현
```

### API 구조

```
Server Actions (주요 CRUD - 'use server'):
+-- actions/orders.ts          # 수주 CRUD + 상태 전환 + 취소 (cancel_order_cascade RPC)
+-- actions/customers.ts       # 고객 CRUD
+-- actions/products.ts        # 제품/자재 CRUD
+-- actions/inventory.ts       # 재고 관리 (RPC 호출)
+-- actions/purchase-orders.ts # 발주 CRUD + 상태 전환
+-- actions/schedules.ts       # 스케줄 CRUD
+-- actions/reports.ts         # 리포트 생성/조회
+-- actions/revenue.ts         # 매출 확정 (revenue_records)
+-- actions/costs.ts           # 매입 확정 (cost_records)

Supabase RPC Functions (트랜잭션 원자성):
+-- hold_materials_for_order(order_id, mode)     # 자재 hold
+-- dispatch_materials_for_order(order_id)        # 자재 불출
+-- release_held_materials(order_id)              # hold 해제
+-- cancel_order_cascade(order_id, reason)        # 수주 취소 연쇄 처리 [NEW]

API Routes (비동기/외부 연동):
+-- api/reports/pdf/route.ts   # PDF 생성 엔드포인트
+-- api/reports/share/route.ts # 리포트 공유 링크
+-- api/upload/route.ts        # 파일 업로드 (현장 사진)
+-- api/stats/route.ts         # 통계/대시보드 데이터
```

### 인증/권한 설계

```
인증 전략:
- Supabase Auth 사용 (이메일/비밀번호)
- 1인 사업자이므로 단일 계정 구조
- 모든 비즈니스 테이블에 user_id 컬럼으로 데이터 격리
- [Track C 보안] @supabase/ssr에서 반드시 getUser() 사용 (getSession 아님)
- 향후 직원 추가 시 역할 기반 확장 가능

미들웨어:
- middleware.ts에서 인증 상태 확인
- 미인증 사용자 -> /login 리다이렉트
- /api/reports/share/* -> 공개 접근 허용 (고객 열람)

세션 관리:
- @supabase/ssr로 쿠키 기반 세션
- 서버/클라이언트 모두에서 세션 접근 가능

RLS 정책:
- 모든 테이블: user_id = auth.uid() 기반 접근 제어
- report_templates: is_default = TRUE인 시스템 템플릿은 전체 공개
- closet_component_presets: is_system = TRUE인 시스템 프리셋은 전체 공개
```

---

## 4. 기능별 상세 설계

### 4.1 대시보드 (Dashboard)

**화면 구성:**
```
/dashboard
+-- 오늘의 일정 (캘린더 요약)
+-- 진행중 수주 현황 (파이프라인 요약)
+-- 재고 경고 (최소 재고 미달 품목)
+-- 이번 달 매출/매입 요약
+-- 빠른 액션 버튼 (신규 수주, 신규 발주)
```

**컴포넌트:**
- `TodayScheduleCard`: 오늘/내일 일정 카드
- `OrderPipelineSummary`: 상태별 수주 건수
- `InventoryAlertList`: 재고 부족 경고
- `MonthlyRevenueSummary`: 이번 달 매출/매입 차트
- `QuickActionBar`: 자주 쓰는 기능 바로가기

**데이터 모델:**
- 각 카드별 서버 컴포넌트로 독립 데이터 로딩
- `@tanstack/react-query`로 클라이언트 사이드 리프레시

**비즈니스 로직:**
- 일정: 오늘 기준 전후 2일 표시 (is_active=TRUE만)
- 재고 경고: `available_quantity < min_stock` 필터
- 매출: 이번 달 revenue_records 합계 [Track G: revenue_records 테이블 사용]

---

### 4.2 수주 관리 (Order Management)

**화면 구성:**
```
/orders
+-- 칸반 뷰 (데스크탑/태블릿 기본) [Track F: 다중 뷰]
+-- 리스트 뷰 (모바일 기본)
+-- 타임라인 뷰
+-- 필터/검색

/orders/new           # 신규 수주 등록
/orders/[id]          # 수주 상세
/orders/[id]/edit     # 수주 수정
/orders/[id]/checklist # 체크리스트
/orders/[id]/model    # 2D/3D 모델링
```

**컴포넌트:**
- `OrderPipeline`: @dnd-kit/react 기반 드래그&드롭 칸반 [Track C: 교체 → @dnd-kit/react]
- `OrderListView`: 모바일용 리스트 뷰 + 상태 전환 버튼
- `OrderTimelineView`: 시간 흐름 기반 수주 추적 [Track F: 추가]
- `OrderCard`: 수주 요약 카드 (고객명, 일자, 금액)
- `OrderForm`: 수주 등록/수정 폼
- `OrderTimeline`: 상태 변화 타임라인
- `StatusTransitionButton`: 다음 상태로 전환 버튼
- `OrderCancelDialog`: 취소 사유 입력 다이얼로그
- `CustomerQuickAdd`: 고객 빠른 등록 (인라인)
- `NewOrderBottomSheet`: 모바일 신규 수주 바텀시트 [Track D: 추가]

**비즈니스 로직:**

상태 전이 규칙 (ORDER_TRANSITIONS 상수 객체로 관리):
```typescript
const ORDER_TRANSITIONS: Record<OrderStatus, {
  forward: OrderStatus[];
  backward: OrderStatus[];
  conditions: string[];
  sideEffects?: string[];
}> = {
  inquiry: {
    forward: ['quotation_sent', 'cancelled'],
    backward: [],
    conditions: ['견적 금액 입력 필수'],
  },
  quotation_sent: {
    forward: ['confirmed', 'cancelled'],
    backward: ['inquiry'],
    conditions: ['확정 금액 입력 필수'],
  },
  confirmed: {
    forward: ['measurement_done', 'cancelled'],
    backward: ['quotation_sent'],
    conditions: ['실측 데이터 입력'],
  },
  measurement_done: {
    forward: ['date_fixed', 'cancelled'],
    backward: ['confirmed'],
    conditions: ['설치 일자 필수'],
  },
  date_fixed: {
    forward: ['material_held', 'cancelled'],
    backward: ['measurement_done'],
    conditions: ['자재 목록 등록 필수'],
    sideEffects: ['hold_materials_for_order RPC 호출'],
  },
  material_held: {
    forward: ['installed', 'cancelled'],
    backward: ['date_fixed'],
    conditions: ['현장 설치 완료 확인'],
    sideEffects: [
      'Forward: dispatch_materials_for_order RPC 호출',
      'Backward: release_held_materials RPC 호출'
    ],
  },
  installed: {
    forward: ['settlement_wait'],
    backward: [],
    conditions: ['정산 정보 입력'],
  },
  settlement_wait: {
    forward: ['revenue_confirmed'],
    backward: [],
    conditions: ['입금 확인'],
  },
  revenue_confirmed: {
    forward: [],
    backward: [],
    conditions: [],
  },
  cancelled: {
    forward: [],
    backward: [],
    conditions: [],
    sideEffects: ['cancel_order_cascade RPC 호출'],
  },
};
```

**취소 시 연쇄 처리 규칙 [Track G 반영]:**
- `inquiry` ~ `material_held`: 취소 가능
- `installed` 이후: 취소 불가
- 취소 시 `cancel_order_cascade` RPC 호출:
  1. 자재 hold 해제 (material_held 상태)
  2. 연결 스케줄 비활성화 (is_active = FALSE)
  3. draft 발주 자동 삭제
  4. cancelled_at, cancellation_reason, cancelled_from_status 기록

---

### 4.3 발주 관리 (Purchase Order Management)

**화면 구성:**
```
/purchases
+-- 발주 목록 (리스트 뷰 기본) [Track F: 다중 뷰]
+-- 타임라인 뷰
+-- 필터/검색

/purchases/new              # 신규 발주
/purchases/[id]             # 발주 상세
/purchases/[id]/receive     # 입고 처리
```

**비즈니스 로직:**
```
draft -> ordered        : 발주서 확정
ordered -> received     : 입고 처리 (재고 증가)
received -> settled     : 비용 정산
settled -> cost_confirmed : 매입 확정 (cost_records에 기록)
```

**발주-수주 기본 연결 [Track G Important #6]:**
- Phase 1에서도 발주 생성 시 관련 수주 선택 가능 (간소화 버전)
- `purchase_order_allocations` 없이 발주.memo에 수주번호 참조
- Phase 2에서 purchase_order_allocations로 정식 연결

**입고 후 재할당 알림 [Track G Important #7]:**
- 입고 완료 시 shortage_quantity > 0인 수주 자동 검색
- "재할당 가능" 알림 표시: "수주 CB-2026-0012에 필요한 앵글프레임 30T 입고됨"

---

### 4.4 재고 관리 (Inventory Management)

**화면 구성:**
```
/inventory
+-- 그리드 뷰 (데스크탑/태블릿 기본) [Track F: 다중 뷰]
+-- 리스트 뷰 (모바일 기본)
+-- 재고 경고 (부족 품목)
+-- 입출고 이력

/inventory/[productId]      # 제품 상세 + 이력
/inventory/adjust           # 재고 조정
```

---

### 4.5 매출/매입 확정 관리 (Financial Settlement) [Track G 반영]

**화면 구성:**
```
/finance
+-- 요약 뷰 (기본) [Track F: 다중 뷰]
+-- 상세 리스트 뷰
+-- 캘린더 뷰
+-- 미정산 목록

/finance/revenue/[orderId]     # 매출 상세
/finance/cost/[poId]           # 매입 상세
```

**비즈니스 로직 [Track G Critical 반영]:**
- 매출 확정: orders.revenue_confirmed_at 기록 + revenue_records에 독립 레코드 생성
- 매입 확정: purchase_orders.status = cost_confirmed + cost_records에 독립 레코드 생성
- 손익 = SUM(revenue_records.confirmed_amount) - SUM(cost_records.confirmed_amount)
- revenue_records/cost_records로 확정 이력 독립 추적 (수주/발주 상태와 분리)

---

### 4.6 스케줄 관리 (Schedule Management) [Track G 반영]

**화면 구성:**
```
/schedule
+-- 월간 캘린더 뷰 (데스크탑/태블릿 기본) [Track F: 다중 뷰]
+-- 주간 타임라인 뷰
+-- 어젠다 뷰 (모바일 기본)
+-- 지도 뷰
```

**비즈니스 로직:**
- 수주 등록 시 실측 일정 자동 생성
- 설치일 확정 시 설치 일정 자동 생성
- 일정 충돌 감지 (같은 시간대 중복 경고)
- **수주->스케줄 단방향 동기화** [Track G Important #5]: 수주에서 스케줄로만 자동 변경. 스케줄 직접 변경 시 "수주 일정도 변경하시겠습니까?" 다이얼로그
- 수주 취소 시 관련 스케줄 자동 비활성화 (is_active = FALSE)

---

### 4.7 리포팅 툴 (Reporting Tool) [Track C 반영: PDF 라이브러리]

**PDF 생성 전략:**
- **@react-pdf/renderer** 사용 (한글 PDF 품질 보장) [Track C: 교체]
- Pretendard 또는 Noto Sans KR 폰트 등록으로 한글 깨짐 방지
- 서버 사이드 렌더링으로 클라이언트 부하 감소
- PDF 생성 시 항상 라이트 테마 기반 (인쇄 최적화)

**체크리스트 기본 항목 (Default Template):**

준비 체크리스트:
```json
[
  { "category": "자재 확인", "items": [
    { "label": "앵글/시스템 프레임 수량 확인", "required": true },
    { "label": "선반 규격/수량 확인", "required": true },
    { "label": "행거봉 길이/수량 확인", "required": true },
    { "label": "하드웨어(나사, 볼트, 브라켓) 확인", "required": true },
    { "label": "서랍/문짝 부품 확인", "required": false },
    { "label": "마감재(엣지, 캡) 확인", "required": false }
  ]},
  { "category": "도구 확인", "items": [
    { "label": "전동 드릴/드라이버", "required": true },
    { "label": "수평계", "required": true },
    { "label": "줄자 (5m 이상)", "required": true },
    { "label": "레이저 레벨기", "required": false },
    { "label": "실리콘/코킹건", "required": false }
  ]},
  { "category": "현장 조건", "items": [
    { "label": "설치 공간 치수 재확인", "required": true },
    { "label": "벽체 상태 확인 (석고보드/콘크리트)", "required": true },
    { "label": "전기/조명 간섭 여부 확인", "required": true },
    { "label": "바닥 수평 확인", "required": true },
    { "label": "기존 가구 철거/이동 완료 확인", "required": false }
  ]}
]
```

---

### 4.8 2D/3D 모델링 페이지 [Track E 반영: Three.js 단일 라이브러리 완전 재작성]

**화면 구성:**
```
/modeling
+-- 2D/3D 통합 에디터
+-- 카메라 모드 전환 (2D 평면도 / 3D 입체)

/orders/[id]/model          # 수주별 모델링
```

**Three.js 단일 라이브러리 아키텍처:**

```typescript
// 핵심 구조
interface ClosetEditorProps {
  initialData?: ClosetSceneData;
  onSave: (data: ClosetSceneData) => void;
}

// 카메라 모드
type CameraMode = '2d' | '3d';

// 2D 모드: OrthographicCamera (위에서 내려다보기)
// 3D 모드: PerspectiveCamera (자유 회전)
// 같은 씬 데이터를 공유하므로 동기화 불필요
```

**컴포넌트:**
- `ClosetEditor`: 메인 에디터 (Canvas + R3F)
- `CameraModeToggle`: 2D/3D 카메라 전환 버튼
- `ComponentPalette`: 드래그할 수 있는 부품 팔레트
- `DimensionOverlay`: 치수 표시 (drei Html 컴포넌트)
- `SnapGrid`: 스냅 그리드 헬퍼 (Math.round(x / gridSize) * gridSize)
- `EditorToolbar`: 확대/축소, 실행 취소, 저장
- `MaterialSelector`: 재질/색상 선택 (3D 모드)

**비즈니스 로직:**
- 드래그&드롭으로 옷장 구성 요소 배치
- 치수 입력 시 비율 자동 조정
- 구성 데이터를 JSONB로 저장 (orders.model_scene_data)
- OrthographicCamera -> PerspectiveCamera 전환으로 2D/3D 즉시 스위칭
- 리포트에 포함할 이미지로 내보내기 (Canvas -> PNG)
- 부품 배치에 따른 자동 자재 산출 (order_materials 연동)

**next.config.js 설정 필수:**
```javascript
// Three.js 동적 임포트 (SSR 방지)
const ClosetEditor = dynamic(() => import('@/components/modeling/closet-editor'), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});
```

---

## 5. MVP vs 확장 단계 구분

### Phase 1: MVP (핵심 기능) - 4~6주

| 기능 | 범위 | 우선순위 |
|------|------|----------|
| 프로젝트 초기 설정 | Next.js, Supabase, PWA, 인증, 다크모드 | P0 |
| 고객 관리 | CRUD, 검색 | P0 |
| 수주 관리 | 전체 파이프라인 (9단계 + 취소), 칸반/리스트/타임라인 뷰, 취소 연쇄 처리 | P0 |
| 스케줄 관리 | 월간/주간/어젠다/지도 뷰, 수주 단방향 연동 | P0 |
| 재고 관리 | 그리드/리스트 뷰, RPC 기반 hold/불출, 경고, 부족 시 UX | P0 |
| 대시보드 | 일정, 수주 현황, 재고 경고 | P1 |
| 모바일 UX | 하단 탭 바, 터치 타겟, 장갑 대응 | P0 |

### Phase 2: 부가 기능 - 3~4주

| 기능 | 범위 | 우선순위 |
|------|------|----------|
| 발주 관리 | 발주~매입 전 과정, 수주-발주 배분, 입고 후 재할당 알림 | P1 |
| 매출/매입 관리 | revenue_records/cost_records 기반 정산, 요약/리스트/캘린더 뷰 | P1 |
| 리포팅 (기본) | 견적서 PDF (@react-pdf/renderer), 체크리스트 | P1 |
| 2D/3D 모델링 (기본) | Three.js 통합 에디터, 부품 프리셋 | P2 |
| PWA 고도화 | 오프라인 캐싱 고도화, 푸시 알림 | P2 |

### Phase 3: 고급 기능 - 4~6주

| 기능 | 범위 | 우선순위 |
|------|------|----------|
| 3D 모델링 (고급) | 재질/색상 프리뷰, 자재 자동 산출 | P3 |
| 리포팅 (고급) | 다양한 템플릿, 공유 링크 | P2 |
| 통계/분석 | 월별/분기별 분석, 차트 | P3 |
| 데이터 백업/내보내기 | CSV, Excel 내보내기 | P3 |

---

## 6. 디렉토리 구조

```
closet-biz/
+-- .env.local
+-- .env.example
+-- next.config.ts
+-- tsconfig.json
+-- package.json
+-- playwright.config.ts
|
+-- public/
|   +-- icons/
|   |   +-- icon-192.png
|   |   +-- icon-512.png
|   +-- fonts/                              # 웹폰트 (셀프 호스팅)
|   +-- sw.js
|
+-- supabase/
|   +-- config.toml
|   +-- migrations/
|   |   +-- 001_initial_schema.sql
|   |   +-- 002_rls_policies.sql
|   |   +-- 003_rpc_functions.sql
|   |   +-- 004_sequences.sql
|   |   +-- 005_revenue_cost_records.sql    # [Track G] 매출/매입 기록
|   |   +-- 006_updated_at_triggers.sql     # [Track B] 자동 트리거
|   |   +-- 007_additional_indexes.sql      # [Track B] 추가 인덱스
|   |   +-- 008_check_constraints.sql       # [Track B] CHECK 제약조건
|   |   +-- 009_seed_data.sql
|   +-- seed.sql
|
+-- src/
|   +-- app/
|   |   +-- manifest.ts
|   |   +-- layout.tsx                      # 루트 레이아웃 (ThemeProvider)
|   |   +-- page.tsx
|   |   +-- globals.css                     # CSS variables (다크모드 토큰)
|   |   |
|   |   +-- (auth)/
|   |   |   +-- login/page.tsx
|   |   |   +-- layout.tsx
|   |   |
|   |   +-- (app)/
|   |   |   +-- layout.tsx                  # 사이드바/네비게이션/하단탭
|   |   |   +-- dashboard/page.tsx
|   |   |   +-- orders/
|   |   |   |   +-- page.tsx                # 수주 (칸반/리스트/타임라인)
|   |   |   |   +-- views-config.ts         # [Track F] 뷰 설정
|   |   |   |   +-- new/page.tsx
|   |   |   |   +-- [id]/
|   |   |   |       +-- page.tsx
|   |   |   |       +-- edit/page.tsx
|   |   |   |       +-- checklist/page.tsx
|   |   |   |       +-- model/page.tsx
|   |   |   +-- customers/
|   |   |   +-- purchases/
|   |   |   |   +-- views-config.ts         # [Track F] 뷰 설정
|   |   |   +-- inventory/
|   |   |   |   +-- views-config.ts         # [Track F] 뷰 설정
|   |   |   +-- finance/
|   |   |   |   +-- views-config.ts         # [Track F] 뷰 설정
|   |   |   +-- schedule/
|   |   |   |   +-- views-config.ts         # [Track F] 뷰 설정
|   |   |   +-- reports/
|   |   |   +-- modeling/
|   |   |       +-- page.tsx
|   |   |
|   |   +-- api/
|   |       +-- reports/
|   |       +-- upload/route.ts
|   |
|   +-- actions/
|   |   +-- orders.ts
|   |   +-- customers.ts
|   |   +-- products.ts
|   |   +-- inventory.ts
|   |   +-- purchase-orders.ts
|   |   +-- schedules.ts
|   |   +-- reports.ts
|   |   +-- revenue.ts                     # [Track G] 매출 확정
|   |   +-- costs.ts                       # [Track G] 매입 확정
|   |
|   +-- components/
|   |   +-- ui/                            # shadcn/ui 기본 컴포넌트
|   |   +-- providers/
|   |   |   +-- theme-provider.tsx         # [Track F] 다크모드 프로바이더
|   |   +-- layout/
|   |   |   +-- sidebar.tsx
|   |   |   +-- mobile-nav.tsx
|   |   |   +-- header.tsx
|   |   |   +-- bottom-tab-bar.tsx         # [Track D] 모바일 하단 탭
|   |   +-- view-switcher/
|   |   |   +-- view-switcher.tsx          # [Track F] 뷰 전환 컴포넌트
|   |   |   +-- view-container.tsx
|   |   +-- orders/
|   |   |   +-- order-pipeline.tsx         # @dnd-kit 칸반
|   |   |   +-- order-list-view.tsx
|   |   |   +-- order-timeline-view.tsx    # [Track F] 타임라인 뷰
|   |   |   +-- order-card.tsx
|   |   |   +-- order-form.tsx
|   |   |   +-- new-order-bottom-sheet.tsx # [Track D] 모바일 바텀시트
|   |   |   +-- shortage-alert-dialog.tsx
|   |   +-- schedule/
|   |   |   +-- calendar-view.tsx
|   |   |   +-- week-timeline-view.tsx     # [Track F] 주간 타임라인
|   |   |   +-- agenda-view.tsx            # [Track F] 어젠다 (모바일)
|   |   |   +-- map-view.tsx               # [Track F] 지도 뷰
|   |   +-- inventory/
|   |   |   +-- inventory-grid.tsx
|   |   |   +-- inventory-list.tsx
|   |   +-- finance/
|   |   |   +-- finance-summary.tsx        # [Track F] 요약 뷰
|   |   |   +-- finance-list.tsx
|   |   |   +-- finance-calendar.tsx       # [Track F] 캘린더 뷰
|   |   +-- modeling/
|   |   |   +-- closet-editor.tsx          # [Track E] Three.js 통합 에디터
|   |   |   +-- camera-mode-toggle.tsx     # [Track E] 2D/3D 전환
|   |   |   +-- component-palette.tsx
|   |   |   +-- dimension-overlay.tsx      # [Track E] drei Html 치수
|   |   |   +-- snap-grid.tsx              # [Track E] 스냅 그리드
|   |   +-- charts/
|   |   |   +-- chart-wrapper.tsx          # [Track F] 차트 다크모드 어댑터
|   |   +-- dashboard/
|   |
|   +-- hooks/
|   |   +-- use-supabase.ts
|   |   +-- use-orders.ts
|   |   +-- use-inventory.ts
|   |   +-- use-media-query.ts
|   |   +-- use-view-state.ts              # [Track F] 뷰 상태 퍼시스턴스
|   |   +-- use-theme.ts                   # [Track F] 테마 훅
|   |
|   +-- lib/
|   |   +-- supabase/
|   |   |   +-- client.ts
|   |   |   +-- server.ts
|   |   |   +-- middleware.ts
|   |   +-- design-tokens.ts               # [Track F] 색상 토큰
|   |   +-- utils.ts
|   |   +-- constants.ts
|   |   +-- validators.ts
|   |   +-- pdf/
|   |       +-- generator.ts               # @react-pdf/renderer 기반
|   |       +-- templates/
|   |
|   +-- types/
|   |   +-- database.ts
|   |   +-- order.ts
|   |   +-- inventory.ts
|   |   +-- schedule.ts
|   |   +-- report.ts
|   |   +-- views.ts                       # [Track F] 뷰 타입 정의
|   |
|   +-- middleware.ts
|
+-- tests/
    +-- unit/
    +-- integration/
    +-- e2e/
```

---

## 7. 구현 순서 (태스크 분해)

### Phase 1: MVP (8~10주) [M1: 48태스크 4-6주 → 현실적 일정 조정]

#### Sprint 1: 프로젝트 기반 (2주)

| # | 태스크 | 의존성 | 복잡도 | 수용 기준 |
|---|--------|--------|--------|-----------|
| 1.1 | Next.js 15 프로젝트 초기화 (App Router, TypeScript, Tailwind v4) | 없음 | LOW | `npm run dev` 정상 실행 |
| 1.2 | shadcn/ui 설치 및 기본 컴포넌트 셋업 | 1.1 | LOW | button, input, card 등 렌더링 |
| 1.3 | Supabase 프로젝트 생성 및 로컬 개발 환경 설정 | 없음 | LOW | `supabase start` 정상 실행 |
| 1.4 | DB 스키마 마이그레이션 (revenue_records, cost_records 포함) | 1.3 | MEDIUM | 모든 테이블 + CHECK + 트리거 확인 |
| 1.5 | RLS 정책 설정 | 1.4 | MEDIUM | user_id 기반 데이터 격리 확인 |
| 1.6 | RPC Functions (hold/dispatch/release/cancel_cascade) | 1.4 | HIGH | 4개 RPC function 트랜잭션 원자성 테스트 |
| 1.7 | Supabase Auth 연동 (getUser() 사용) | 1.3, 1.1 | MEDIUM | 로그인/로그아웃 정상 |
| 1.8 | Next.js 미들웨어 설정 | 1.7 | LOW | 미인증 시 리다이렉트 |
| 1.9 | 공통 레이아웃 (사이드바, 하단탭바, 헤더) | 1.2 | MEDIUM | 반응형 네비게이션 |
| 1.10 | 다크모드 기반 구현 (ThemeProvider, CSS variables, 색상 토큰) | 1.1, 1.2 | MEDIUM | 라이트/다크/시스템 전환, WCAG AA 통과 |
| 1.11 | 폰트 설치 (Pretendard, Inter, JetBrains Mono) | 1.1 | LOW | 한영 혼용 폰트 렌더링 확인 |
| 1.12 | PWA 기본 설정 (@serwist/next) | 1.1 | MEDIUM | A2HS 프롬프트, 앱 셸 캐싱 |
| 1.13 | 뷰 시스템 기반 (ViewSwitcher, useViewState, ViewContainer) | 1.2 | MEDIUM | 반응형 뷰 전환 동작 |
| 1.14 | Supabase 타입 자동 생성 설정 | 1.4 | LOW | gen types 정상 실행 |
| 1.15 | Playwright 초기 설정 | 1.1 | LOW | 테스트 실행 확인 |
| 1.16 | Zod 스키마 정의 (closetSpecSchema, ORDER_TRANSITIONS) | 1.1 | LOW | 스키마 검증 테스트 |

#### Sprint 2: 고객 관리 + 수주 관리 기본 (2주)

| # | 태스크 | 의존성 | 복잡도 | 수용 기준 |
|---|--------|--------|--------|-----------|
| 2.1 | 고객 CRUD Server Actions | 1.4, 1.7 | LOW | 고객 CRUD 동작 |
| 2.2 | 고객 목록/상세 페이지 | 2.1, 1.9 | MEDIUM | 검색, 페이지네이션 |
| 2.3 | 고객 등록/수정 폼 (Zod 검증) | 2.1 | LOW | 폼 검증 동작 |
| 2.4 | 수주 CRUD Server Actions | 1.4, 1.7 | MEDIUM | 수주 CRUD + 채번 |
| 2.5 | 수주 상태 전이 로직 (정방향+역방향+취소 연쇄) | 2.4, 1.16 | HIGH | cancel_order_cascade 포함 전이 검증 |
| 2.6 | 수주 리스트 뷰 (모바일 기본) | 2.4, 1.9, 1.13 | MEDIUM | 필터, 검색, 상태별 필터링 |
| 2.7 | 수주 칸반 뷰 (@dnd-kit, 데스크탑) | 2.6 | HIGH | 드래그&드롭 상태 변경 |
| 2.8 | 수주 타임라인 뷰 | 2.6 | MEDIUM | 시간 흐름 기반 상태 추적 |
| 2.9 | 수주 등록/수정 폼 | 2.4, 2.1 | MEDIUM | 고객 연결, 옷장 사양 입력 |
| 2.10 | 수주 상세 페이지 (타임라인 + 취소) | 2.5 | MEDIUM | 상태 이력, 취소 다이얼로그 |
| 2.11 | 모바일 신규 수주 Bottom Sheet | 2.9 | MEDIUM | 최소 필드만 표시 |

#### Sprint 3: 재고 관리 + 스케줄 (2.5주)

| # | 태스크 | 의존성 | 복잡도 | 수용 기준 |
|---|--------|--------|--------|-----------|
| 3.1 | 제품/자재 CRUD Server Actions | 1.4 | LOW | 제품 CRUD 동작 |
| 3.2 | 재고 관리 Server Actions (RPC 기반) | 3.1, 1.6 | HIGH | 트랜잭션 원자성 |
| 3.3 | 재고 그리드/리스트 뷰 (다중 뷰) | 3.1, 3.2, 1.13 | MEDIUM | 가용재고, 색상 배지 |
| 3.4 | 재고-수주 연동 (RPC 기반 hold/불출) | 3.2, 2.5 | HIGH | 상태 변경 시 RPC 자동 호출 |
| 3.5 | 재고 부족 시 UX (부족분 발주/부분 hold) | 3.4 | HIGH | ShortageAlertDialog, 체크리스트 아코디언 |
| 3.6 | 재고 변동 이력 페이지 | 3.2 | LOW | 입출고 타임라인 |
| 3.7 | 재고 경고 기능 | 3.2 | LOW | 부족 품목 리스트, 재고 부족 상단 고정 |
| 3.8 | 수주별 자재 관리 (order_materials) | 3.1, 2.4 | MEDIUM | hold/shortage 수량 표시 |
| 3.9 | 스케줄 CRUD Server Actions (is_active 포함) | 1.4 | LOW | 일정 CRUD + 비활성화 |
| 3.10 | 스케줄 월간 캘린더 뷰 (@schedule-x/react) | 3.9, 1.13 | HIGH | 일정 표시, 한국어 locale |
| 3.11 | 스케줄 주간 타임라인 뷰 | 3.10 | MEDIUM | 시간대별 블록 |
| 3.12 | 스케줄 어젠다 뷰 (모바일) | 3.9 | MEDIUM | 크로놀로지컬 리스트, 체크박스 |
| 3.13 | 수주-스케줄 단방향 연동 | 3.9, 2.5 | MEDIUM | 자동 생성, 변경 다이얼로그 |
| 3.14 | 일정 충돌 감지 | 3.9 | MEDIUM | 같은 시간 경고 |

#### Sprint 4: 대시보드 + 통합 테스트 (1.5주)

| # | 태스크 | 의존성 | 복잡도 | 수용 기준 |
|---|--------|--------|--------|-----------|
| 4.1 | 대시보드 - 오늘의 일정 카드 | 3.10 | LOW | 오늘/내일 일정 (is_active만) |
| 4.2 | 대시보드 - 수주 파이프라인 요약 | 2.7 | LOW | 상태별 건수 |
| 4.3 | 대시보드 - 재고 경고 리스트 | 3.7 | LOW | 부족 품목, 자재 부족 수주 |
| 4.4 | 대시보드 - 빠른 액션 바 | 1.9 | LOW | 바로가기 |
| 4.5 | E2E 통합 테스트 (수주 전체 + 취소 연쇄) | 2.5, 3.4, 3.13 | HIGH | 전 과정 + 연쇄 취소 동작 |
| 4.6 | 모바일 반응형 QA + 다크모드 QA | 모든 UI | MEDIUM | 실기기 테스트, 다크모드 전환 |
| 4.7 | PWA 앱 셸 오프라인 캐싱 확인 | 1.12 | MEDIUM | 오프라인 로딩, 배너 표시 |

---

### Phase 2: 부가 기능 (3~4주)

#### Sprint 5: 발주 관리 + 매출/매입 (1.5주)

| # | 태스크 | 의존성 | 복잡도 | 수용 기준 |
|---|--------|--------|--------|-----------|
| 5.1 | 발주 CRUD Server Actions | Phase 1 | MEDIUM | 발주 CRUD + 채번 |
| 5.2 | 발주 리스트/타임라인 뷰 | 5.1, 1.13 | MEDIUM | 다중 뷰, 상태 탭 |
| 5.3 | 발주 등록 폼 (수주 기본 연결 포함) | 5.1, 3.1 | MEDIUM | 관련 수주 선택 가능 |
| 5.4 | 입고 처리 (부분 입고 + 재할당 알림) | 5.1, 3.2 | HIGH | 입고 시 재고 증가, shortage 수주 알림 |
| 5.5 | purchase_order_allocations 구현 | 5.1, 2.4 | MEDIUM | 수주별 원가 추적 |
| 5.6 | 매출 확정 (revenue_records) | 2.5 | MEDIUM | 독립 매출 기록, 확정 이력 |
| 5.7 | 매입 확정 (cost_records) | 5.1 | MEDIUM | 독립 매입 기록, 확정 이력 |
| 5.8 | 매출/매입 요약/리스트/캘린더 뷰 | 5.6, 5.7, 1.13 | MEDIUM | 3개 뷰 전환, 차트 |

#### Sprint 6: 리포팅 + 2D/3D 모델링 (2주)

| # | 태스크 | 의존성 | 복잡도 | 수용 기준 |
|---|--------|--------|--------|-----------|
| 6.1 | PDF 생성 엔진 (@react-pdf/renderer + 한글 폰트) | Phase 1 | HIGH | 한글 PDF 정상 생성 |
| 6.2 | 견적서 PDF 템플릿 | 6.1 | MEDIUM | 고객정보, 사양, 금액 |
| 6.3 | 체크리스트 기능 (기본 템플릿) | 2.10 | MEDIUM | 아코디언 UI, 재고 부족 상단 고정 |
| 6.4 | 체크리스트 PDF 템플릿 | 6.1, 6.3 | MEDIUM | 체크 결과 PDF |
| 6.5 | 리포트 저장 및 목록 관리 | 6.1 | MEDIUM | Storage 저장/조회 |
| 6.6 | closet_component_presets + 시스템 프리셋 | Phase 1 | MEDIUM | 기본 부품 프리셋 |
| 6.7 | Three.js 통합 에디터 기본 셋업 (dynamic import) | Phase 1 | HIGH | Canvas 렌더링, OrthographicCamera |
| 6.8 | 부품 팔레트 (프리셋 기반) | 6.7, 6.6 | MEDIUM | 드래그 가능 부품 목록 |
| 6.9 | 드래그&드롭 배치 + 치수 + 스냅 그리드 | 6.7, 6.8 | HIGH | 부품 배치, 스냅, 치수 표시 |
| 6.10 | 2D/3D 카메라 전환 | 6.7 | MEDIUM | Ortho/Perspective 전환 |
| 6.11 | 모델 저장/불러오기 (JSONB) | 6.9, 2.4 | MEDIUM | 수주별 모델 데이터 |
| 6.12 | 모델 이미지 내보내기 (PNG) | 6.9 | LOW | Canvas -> PNG |

---

### Phase 3: 고급 기능 (4~6주)

#### Sprint 7: 고급 리포팅 + PWA 고도화 (2주)

| # | 태스크 | 의존성 | 복잡도 | 수용 기준 |
|---|--------|--------|--------|-----------|
| 7.1 | 설치 완료 보고서 템플릿 | 6.1 | MEDIUM | 시공 전후 사진 포함 |
| 7.2 | 리포트 공유 링크 (고객용) | 6.5 | MEDIUM | UUID 토큰 기반 |
| 7.3 | 리포트 템플릿 관리 (CRUD) | 6.5 | MEDIUM | 커스텀 템플릿 |
| 7.4 | 현장 사진 업로드 (로컬 저장 후 백그라운드 업로드) | Phase 1 | MEDIUM | 오프라인 대응 |
| 7.5 | 오프라인 캐싱 고도화 | 1.12 | HIGH | 주요 데이터 오프라인 접근 |
| 7.6 | 푸시 알림 (일정 알림) | 1.12 | HIGH | 설치일 전날 알림 |
| 7.7 | 데이터 내보내기 (CSV/Excel) | Phase 2 | MEDIUM | 수주/매출 데이터 |

#### Sprint 8: 3D 모델링 고급 + 통계 (2~3주)

| # | 태스크 | 의존성 | 복잡도 | 수용 기준 |
|---|--------|--------|--------|-----------|
| 8.1 | 파라메트릭 옷장 3D 모델 (코드 생성 geometry) | 6.7 | HIGH | 치수 기반 자동 생성 |
| 8.2 | 재질/색상 변경 프리뷰 | 8.1 | MEDIUM | 실시간 변경 |
| 8.3 | 3D 스크린샷 캡처 -> 리포트 | 8.1, 6.1 | MEDIUM | 3D 이미지 PDF 포함 |
| 8.4 | 자재 자동 산출 (부품 배치 기반) | 6.9, 3.8 | HIGH | 자재 목록 자동 생성 |
| 8.5 | 스케줄 지도 뷰 구현 | 3.9 | MEDIUM | 위치 마커, 동선 최적화 |
| 8.6 | 월별/분기별 통계 분석 대시보드 | 5.8 | MEDIUM | 매출 트렌드, 수주 분석 |

---

## 8. 리스크 및 완화 전략

| # | 리스크 | 영향도 | 발생 확률 | 완화 전략 |
|---|--------|--------|-----------|-----------|
| R1 | PWA 오프라인 동기화 복잡성 | HIGH | HIGH | Phase 1: 읽기 전용 앱 셸 캐싱만. Phase 3에서 점진적 구현. 현장 사진 로컬 저장 후 백그라운드 업로드. |
| R2 | Three.js 통합 에디터 개발 난이도 | HIGH | MEDIUM | 2D(OrthographicCamera)부터 심플 구현. 3D는 카메라 전환만 추가. SSR 방지 dynamic import 필수. |
| R3 | Supabase Free Tier 용량 제한 | MEDIUM | LOW | 사진 해상도 최적화. Pro 업그레이드 시점 모니터링. |
| R4 | 모바일 UX 품질 | HIGH | MEDIUM | 터치 타겟 44px+, 하단 탭 바, 장갑 대응 스피너. Sprint마다 실기기 테스트. |
| R5 | 재고-수주 연동 데이터 정합성 | HIGH | MEDIUM | RPC function + SELECT FOR UPDATE + RAISE EXCEPTION. cancel_order_cascade로 연쇄 처리. |
| R6 | PDF 생성 한글 품질 | MEDIUM | MEDIUM | @react-pdf/renderer@4.x 서버사이드 전용. Pretendard 폰트 등록. |
| R7 | @dnd-kit/react Next.js 호환성 | LOW | LOW | "use client" 래퍼 필수. @dnd-kit/core는 레거시이므로 @dnd-kit/react 사용. |
| R8 | @schedule-x/react 한국어 locale | MEDIUM | MEDIUM | 설치 후 즉시 locale 테스트. 미지원 시 커스텀 locale 작성. |
| R9 | 트랜잭션 원자성 보장 실패 | HIGH | LOW | 4개 RPC function이 단일 트랜잭션 원자성 보장. 통합 테스트 필수. |

---

## 9. 검증 방법

### Phase 1 완료 기준

| 검증 항목 | 방법 | 기준 |
|-----------|------|------|
| 인증 | 수동 테스트 | 로그인/로그아웃/세션 유지 (getUser 사용) |
| 수주 파이프라인 | Playwright E2E | 9단계 전이 + 3개 뷰 전환 |
| 수주 취소 연쇄 | Playwright E2E | 스케줄 비활성화, draft 발주 삭제 확인 |
| 수주 역방향 | Playwright E2E | 허용/비허용 역방향 검증 |
| 재고 연동 | 통합 테스트 | RPC hold/불출 + CHECK 제약조건 |
| 스케줄 다중 뷰 | 수동 테스트 | 월간/주간/어젠다 뷰 전환 |
| 다크모드 | 수동 테스트 | 라이트/다크/시스템 전환, 차트/캘린더 테마 |
| 모바일 UX | 실기기 테스트 | 터치 타겟 44px+, 하단 탭 바, 뷰 전환 |
| PWA | Lighthouse | PWA 90+, Performance 80+ |
| 접근성 | axe DevTools | WCAG AA 준수, 색상 대비 |

---

## 10. 다크모드 및 테마 시스템 [Track F 신규 섹션]

### 10.1 디자인 방향: Industrial Precision

**Aesthetic**: Brutalist clarity meets refined functionality. Sharp contrast ratios, geometric layouts, utilitarian type hierarchy. Built for field work under harsh sunlight and late-night office calculations.

### 10.2 색상 팔레트

**라이트 모드 핵심:**
- Background: #FAFAFA / Card: #FFFFFF
- Primary text: #0A0A0A (19.8:1 AAA)
- Secondary text: #525252 (7.2:1 AAA)
- Brand primary: #0F172A (deep slate)
- Accent: #F59E0B (warm amber - tool belt orange)

**다크 모드 핵심:**
- Background: #0A0A0A / Card: #171717
- Primary text: #FAFAFA (19.8:1 AAA)
- Secondary text: #A3A3A3 (7.2:1 AAA)
- Brand primary: #F1F5F9 (light slate)
- Accent: #FBBF24 (brighter amber)

**수주 상태 색상 (10단계) [C9: DB ENUM 일치]:**
- inquiry: Violet (#8B5CF6 / #A78BFA)
- quotation_sent: Blue (#3B82F6 / #60A5FA)
- confirmed: Green (#10B981 / #34D399)
- measurement_done: Teal (#14B8A6 / #2DD4BF)
- date_fixed: Amber (#F59E0B / #FBBF24)
- material_held: Cyan (#06B6D4 / #22D3EE)
- installed: Pink (#EC4899 / #F472B6)
- settlement_wait: Orange (#F97316 / #FB923C)
- revenue_confirmed: Emerald (#059669 / #10B981)
- cancelled: Gray (#6B7280 / #9CA3AF)

### 10.3 구현 전략

- CSS Variables + Tailwind dark: prefix
- `ThemeProvider` 컴포넌트: light / dark / system 3모드
- 시스템 감지: `prefers-color-scheme` media query
- localStorage 퍼시스턴스: `closetbiz-theme`
- 모바일 theme-color meta tag 동적 업데이트
- PDF 생성 시 항상 라이트 모드 강제
- 차트(Recharts) + 캘린더(@schedule-x) 다크모드 어댑터

### 10.4 타이포그래피

| 용도 | 폰트 | 비고 |
|------|------|------|
| 기본 (한글+영문) | Pretendard Variable | Inter 기반 설계, 한영 혼용 최적 |
| 영문 fallback | Inter Variable | Pretendard와 곡률 동일 |
| Monospace (숫자, 코드) | JetBrains Mono Variable | Tabular numerals |

### 10.5 모션 디자인

- Duration: 150-250ms (현장 최적화, 불필요한 애니메이션 배제)
- `prefers-reduced-motion` 지원
- 핵심 애니메이션: 뷰 전환 fade/slide, 상태 변경 pulse, 드래그 피드백, 로딩 스켈레톤

---

## 11. 다중 뷰 시스템 [Track F 신규 섹션]

### 11.1 뷰 타입 분류 (13개)

| 화면 | 지원 뷰 | 모바일 기본 | 데스크탑 기본 |
|------|---------|------------|-------------|
| **수주** | 칸반, 리스트, 타임라인 | 리스트 | 칸반 |
| **스케줄** | 월간 캘린더, 주간 타임라인, 어젠다, 지도 | 어젠다 | 월간 캘린더 |
| **재고** | 그리드, 리스트 | 리스트 | 그리드 |
| **매출/매입** | 요약, 리스트, 캘린더 | 요약 | 요약 |
| **발주** | 리스트, 타임라인 | 리스트 | 리스트 |

### 11.2 ViewSwitcher 컴포넌트

반응형 variant 자동 적용:
- **Desktop (>=1024px)**: Tabs 형태
- **Tablet (768-1023px)**: Buttons 형태
- **Mobile (<768px)**: Dropdown 형태

### 11.3 useViewState 훅

- localStorage 퍼시스턴스 (화면별 독립 저장)
- 브레이크포인트 변경 시 적합한 기본 뷰 자동 전환
- 모바일에서 불가능한 뷰 자동 필터링 (칸반, 타임라인 제외)

---

## 12. 모바일 UX 가이드라인 [Track D 신규 섹션]

### 12.1 P0 (즉시 적용)

| 항목 | 규격 | 설명 |
|------|------|------|
| 터치 타겟 | 최소 44px, 주요 액션 56px | WCAG 2.1 모바일 접근성 |
| 하단 탭 바 | 홈 / 수주 / (+) / 재고 / 설정 | 배지 시스템 (미정산 건수 등) |
| 현장 사진 | 로컬 저장 후 백그라운드 업로드 | 네트워크 불안정 대응 |
| 숫자 입력 | 큰 숫자 스피너 (장갑 착용 대응) | +/- 버튼 56px, 숫자 24px+ |

### 12.2 P1 (Phase 1 내)

| 항목 | 설명 |
|------|------|
| 신규 수주 Bottom Sheet | 최소 필드만 (고객명, 연락처, 유형) |
| 체크리스트 아코디언 | 카테고리별 접기/펼치기 |
| 재고 부족 상단 고정 | 부족 품목 sticky 배너 |
| 모바일 간단 견적 모드 | 2D 에디터 없이 텍스트 기반 사양 입력 |

### 12.3 모바일 하단 탭 바 구조

```
+--------+--------+--------+--------+--------+
|  홈    |  수주   |  (+)   |  재고   |  설정  |
| (Home) |(Orders)|(Quick) |(Stock) |(Gear)  |
|        | [3]    |        | [!]    |        |
+--------+--------+--------+--------+--------+

[3] = 진행중 수주 건수 배지
[!] = 재고 부족 경고 배지
(+) = 빠른 추가 FAB (수주/발주/일정 선택)
```

---

## 13. 통합 연동 매트릭스 [Track G 신규 섹션]

### 13.1 5모듈 x 5모듈 연동 관계

| From / To | 수주 | 발주 | 재고 | 스케줄 | 매출/매입 |
|-----------|------|------|------|--------|-----------|
| **수주** | - | 부족분 발주 생성 | hold/불출/해제 RPC | 실측/설치 일정 자동생성 | revenue_records 생성 |
| **발주** | 수주별 원가 배분 | - | 입고 시 재고 증가 | - | cost_records 생성 |
| **재고** | shortage 알림 | 입고 후 재할당 알림 | - | - | - |
| **스케줄** | 수주->스케줄 단방향 | - | - | - | - |
| **매출/매입** | 수주 확정금액 참조 | 발주 총액 참조 | - | - | - |

### 13.2 취소 시 연쇄 처리 규칙

```
수주 취소 (cancel_order_cascade)
  |
  +-- 1. material_held 상태: release_held_materials (hold 해제)
  +-- 2. 관련 스케줄: is_active = FALSE
  +-- 3. draft 발주: 자동 삭제 (items + allocations 포함)
  +-- 4. 수주 상태: cancelled + 취소 메타데이터 기록
```

### 13.3 스케줄-수주 동기화 규칙

- **방향**: 수주 -> 스케줄 (단방향)
- 수주에서 일정 변경: 연결 스케줄 자동 업데이트
- 스케줄에서 직접 변경: "수주 일정도 변경하시겠습니까?" 확인 다이얼로그
- 수주 취소: 스케줄 비활성화 (삭제가 아닌 is_active=FALSE)

---

## 부록 A: 핵심 비즈니스 플로우 상태 다이어그램

### Main Flow (수주)

```
[inquiry] 고객전화(의뢰)
    |
    +-->  [quotation_sent] 전화회신(견적)
    |       |
    |       +--> [confirmed] 전화요청(수주)
    |       |       |
    |       |       +--> [measurement_done] 방문 실측 완료
    |       |       |       |
    |       |       |       +--> [date_fixed] 현장 장문일자 확정
    |       |       |       |       |
    |       |       |       |       +--> [material_held] 사전 준비
    |       |       |       |       |       |   RPC: hold_materials_for_order
    |       |       |       |       |       |
    |       |       |       |       |       +--> [installed] 현장 설치
    |       |       |       |       |       |       |   RPC: dispatch_materials_for_order
    |       |       |       |       |       |       |
    |       |       |       |       |       |       +--> [settlement_wait] 정산대기
    |       |       |       |       |       |       |       |
    |       |       |       |       |       |       |       +--> [revenue_confirmed] 매출확정
    |       |       |       |       |       |       |             + revenue_records 생성
    |       |       |       |       |       |       |
    |       |       |       |       |       |       +-- (역방향/취소 불가)
    |       |       |       |       |       |
    |       |       |       |       |       +--< [date_fixed] (역방향: hold 해제)
    |       |       |       |       |       |     RPC: release_held_materials
    |       |       |       |       |       |
    |       |       |       |       |       +--> [cancelled] (cancel_order_cascade)
    |       |       |       |       |             연쇄: hold해제 + 스케줄비활성화 + draft발주삭제
    |       |       |       |       |
    |       |       |       |       +--> [cancelled]
    |       |       |       |
    |       |       |       +--> [cancelled]
    |       |       |
    |       |       +--> [cancelled]
    |       |
    |       +--> [cancelled]
    |
    +--> [cancelled]
```

### Sub Flow (발주)

```
[draft] 발주 작성
    |
    v
[ordered] 발주 완료 --- 비용 발생
    |
    v
[received] 입고 완료 --- 재고 증가 + shortage 수주 재할당 알림
    |
    v
[settled] 정산 완료
    |
    v
[cost_confirmed] 매입확정 + cost_records 생성
```

---

## 부록 B: 커밋 전략

```
feat: 새로운 기능 추가
fix: 버그 수정
refactor: 코드 리팩토링
style: UI/스타일 변경
docs: 문서 수정
test: 테스트 추가/수정
chore: 빌드/설정 변경

예시:
feat(orders): 수주 칸반/리스트/타임라인 다중 뷰 구현
feat(orders): cancel_order_cascade 수주 취소 연쇄 처리
feat(theme): 다크모드 테마 시스템 (CSS variables + ThemeProvider + Pretendard)
feat(views): ViewSwitcher + useViewState 다중 뷰 기반
feat(inventory): RPC 기반 재고 hold/불출 + CHECK 제약조건
feat(schedule): 월간/주간/어젠다 다중 뷰 + 수주 단방향 동기화
feat(modeling): Three.js 단일 라이브러리 2D/3D 통합 에디터
feat(finance): revenue_records/cost_records 독립 매출/매입 추적
feat(mobile): 하단 탭 바 + 터치 타겟 최적화 + 장갑 대응
```

**브랜치 전략 (1인 개발):**
- `main`: 프로덕션 배포
- `develop`: 개발 통합
- `feature/*`: 기능 개발 (Sprint별)

---

**End of Final Consolidated Plan**

- 총 DB 테이블: 15개 (기존 13 + revenue_records + cost_records)
- 총 RPC Functions: 4개 (기존 3 + cancel_order_cascade)
- 총 뷰 타입: 13개 across 5 screens
- 접근성: WCAG AA 준수
- 반응형: Mobile (<768px), Tablet (768-1023px), Desktop (>=1024px)
