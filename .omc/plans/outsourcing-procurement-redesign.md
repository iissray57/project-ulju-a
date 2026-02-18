# 발주 체계 재설계: 자재 발주 + 외주 발주

## 배경
- 앵글(30%): 자재 직접 구매 → 재고 → 사용
- 시스템장(50%): 외주 업체 제작 의뢰 → 수령 → 설치
- 커튼(20%): 외주 업체 제작 의뢰 → 수령 → 설치
- 혼합 주문 가능 (1주문 N외주)
- 철거: 극히 드문 경우

## 설계 결정사항

### 1. 발주 이원화
- **자재 발주** (기존 `/purchases` 유지): 앵글 자재 구매 전용
- **외주 발주** (신규): 시스템장/커튼 제작 의뢰

### 2. 주문 상태 흐름 (변경 없음)
```
의뢰 → 견적 → 작업 → 정산대기 → 매출확정
```
- "작업" 단계에서 외주 발주 생성/관리
- 외주 발주 전체 완료되어야 "정산대기" 전이 가능 (앵글only면 바로 가능)

### 3. 외주 발주 상세
- DB 테이블: `outsource_orders`
- 상태: `requested(의뢰) → in_progress(제작중) → completed(완료) → cancelled(취소)`
- 주문 1건에 외주 N건 (시스템장 1건 + 커튼 1건 등)
- 거래처(suppliers) 연결

### 4. 외주 발주서 (PDF 1장)
- 고객명, 현장주소
- 사이즈/색상, 특이사항 메모
- 평면도 + 입면도 (2D 에디터 이미지)
- 클립보드 복사 기능

### 5. 원가/마진 추적
- 앵글: 자재 사용량 × 발주 단가 = 자재 원가
- 시스템장/커튼: 외주 발주 금액 = 매입 원가
- 혼합: 자재 원가 + 외주 원가 합산
- 주문별 마진율 = (매출 - 원가) / 매출 × 100

### 6. 재고관리
- 앵글 자재만 실재고 추적
- 시스템장/커튼 품목은 품목관리에만, 재고 화면에는 "외주 품목" 표기

## DB 스키마

### outsource_orders 테이블
```sql
CREATE TABLE outsource_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),

  -- 발주 정보
  outsource_number TEXT NOT NULL UNIQUE,  -- 자동 채번 (OS-YYYYMMDD-NNN)
  outsource_type TEXT NOT NULL CHECK (outsource_type IN ('system', 'curtain')),

  -- 스펙
  spec_summary TEXT,          -- 사이즈/색상 요약
  memo TEXT,                  -- 특이사항
  plan_image_url TEXT,        -- 평면도 URL
  elevation_image_url TEXT,   -- 입면도 URL

  -- 금액
  amount NUMERIC DEFAULT 0,   -- 외주비 (매입 원가)

  -- 상태
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'in_progress', 'completed', 'cancelled')),

  -- 납기
  requested_date DATE,        -- 의뢰일
  due_date DATE,              -- 납기 예정일
  completed_date DATE,        -- 완료일

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### orders 테이블 변경
- `total_cost` NUMERIC 추가 (총 원가 = 자재 원가 + 외주 원가)
- 또는 계산 시점에 동적 집계

## 태스크 분해

### T1. DB 마이그레이션
- outsource_orders 테이블 생성 + RLS + 인덱스
- generate_outsource_number RPC 함수

### T2. 외주 발주 서버 액션
- CRUD (생성, 조회, 수정, 삭제)
- 상태 전이 (requested → in_progress → completed)
- 주문별 외주 목록 조회

### T3. 외주 발주 UI (주문 상세 내)
- 외주 발주 섹션 컴포넌트 (주문 상세 페이지에 추가)
- 외주 발주 생성 다이얼로그
- 외주 상태 변경 UI
- 외주비 입력

### T4. 작업→정산대기 전이 검증
- 외주 발주가 있으면 전체 완료 여부 체크
- transitionOrderStatus 수정

### T5. 외주 발주서 PDF
- PDF 템플릿 (고객정보 + 스펙 + 평면도 + 입면도)
- 다운로드 + 클립보드 복사

### T6. 원가/마진 계산
- 주문별 원가 집계 (자재 원가 + 외주 원가)
- 주문 상세에 원가/마진 표시
- 매출/매입 페이지에 마진율 반영

### T7. 통합 테스트
- 온라인 견적요청 → 주문 전환 → 외주 발주 → 완료 → 정산
- 유선 의뢰 → 견적 → 작업 → 자재 사용 → 정산
- 혼합 주문 (앵글 + 커튼) 시나리오
- 재고 수불 검증
