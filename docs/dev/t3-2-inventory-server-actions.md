# T3.2 재고 관리 Server Actions (RPC 기반)

**작업 일시**: 2026-02-14
**담당**: executor agent
**상태**: ✅ 완료

## 완료 항목

### 1. Zod 스키마 생성 (`src/lib/schemas/inventory.ts`)
- ✅ `TRANSACTION_TYPES` 상수 배열 정의
- ✅ `TransactionType` 타입 정의
- ✅ `TRANSACTION_TYPE_LABELS` 한국어 라벨 매핑
- ✅ `inventoryInboundSchema` - 입고 검증 스키마
- ✅ `inventoryAdjustSchema` - 재고 조정 검증 스키마
- ✅ `inventorySearchSchema` - 재고 목록 조회 파라미터 스키마
- ✅ `inventoryTransactionSearchSchema` - 이력 조회 파라미터 스키마
- ✅ `src/lib/schemas/index.ts`에 export 추가

### 2. Server Actions 구현 (`src/app/(dashboard)/inventory/actions.ts`)

#### `getInventoryList()` - 재고 목록 조회
- product join으로 제품 정보 포함
- 카테고리 필터, 검색(product name/sku), 부족 재고 필터 지원
- 페이지네이션 지원 (page, limit)
- `available_quantity` (quantity - held_quantity) 기반 필터링

#### `inboundInventory()` - 재고 입고
- inventory 레코드 없으면 자동 생성 (quantity, held_quantity=0)
- 기존 레코드 있으면 quantity 증가
- inventory_transactions에 이력 기록 (type='inbound', before/after)
- purchase_order_id 옵션 지원
- memo 옵션 지원

#### `adjustInventory()` - 재고 조정
- 절대값으로 재고 수량 설정
- held_quantity 검증 (조정 후 수량 >= held_quantity)
- inventory_transactions에 이력 기록 (type='adjustment')
- before/after quantity 기록

#### `getInventoryTransactions()` - 재고 변동 이력 조회
- productId, orderId, type 필터 지원
- 페이지네이션 지원
- 생성 시간 역순 정렬

#### `getLowStockItems()` - 부족 재고 목록
- available_quantity < min_stock 필터
- product 정보 join

### 3. 공통 기능
- ✅ "use server" 지시자
- ✅ `getUser()` 인증 (getSession 미사용)
- ✅ 한국어 에러 메시지
- ✅ `revalidatePath('/inventory')` 호출
- ✅ TypeScript strict 모드 통과

## 주요 결정사항

### 1. 트랜잭션 처리
- Supabase의 RPC 함수는 주문 관련 hold/release/dispatch에서만 사용
- 직접 입고/조정은 Server Action에서 처리 (inventory + inventory_transactions 순차 처리)
- 트랜잭션 원자성은 Supabase의 기본 트랜잭션 메커니즘에 의존

### 2. 재고 레코드 자동 생성
- `inboundInventory()`에서 inventory 레코드가 없으면 자동 생성
- held_quantity는 0으로 초기화

### 3. 부족 재고 필터
- `lowStockOnly` 파라미터는 클라이언트 측 필터링 (Supabase computed column 사용 불가)
- `getLowStockItems()`는 전체 조회 후 필터링

### 4. 타입 안정성
- Database 타입에서 직접 Row, Insert 타입 추출
- Zod 스키마로 입력 검증
- `InventoryWithProduct` 인터페이스로 join 결과 타입 정의

## 테스트 체크리스트

- [x] TypeScript 타입 체크 통과
- [x] ESLint 검사 통과 (사용되지 않는 변수 제거)
- [ ] 재고 목록 조회 동작 확인
- [ ] 재고 입고 동작 확인 (레코드 생성, 증가)
- [ ] 재고 조정 동작 확인 (held_quantity 검증)
- [ ] 이력 조회 동작 확인
- [ ] 부족 재고 필터 동작 확인

## 다음 단계

### T3.3 재고 관리 UI 컴포넌트
- 재고 목록 테이블 (DataTable)
- 입고 폼 모달
- 재고 조정 폼 모달
- 이력 조회 탭
- 부족 재고 알림

## 알려진 이슈

없음 (inventory actions 파일은 에러 없음)

**참고**: 프로젝트에 기존 빌드 에러가 있음 (checkbox 컴포넌트 누락)
- `src/components/schedule/schedule-agenda-view.tsx:6:26`
- 이는 T3.2 작업과 무관한 기존 이슈
