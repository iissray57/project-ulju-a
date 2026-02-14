# T3.8 수주별 자재 관리 (order_materials) 구현 완료

**작업일**: 2026-02-14
**작업자**: executor agent

## 완료 항목

### 1. Zod 스키마 추가
- **파일**: `src/lib/schemas/order-material.ts`
- **내용**:
  - `orderMaterialSchema`: 수주별 자재 등록/수정 폼 검증
  - 필드: `order_id`, `product_id`, `planned_quantity`, `memo`
  - UUID 검증, 정수/음수 검증 포함
- `src/lib/schemas/index.ts`에 export 추가

### 2. Server Actions 구현
- **파일**: `src/app/(dashboard)/orders/material-actions.ts`
- **구현된 액션**:
  1. `getOrderMaterials(orderId)`: 수주별 자재 목록 조회 (product join)
     - product 정보 (id, name, category, sku, unit) 포함
  2. `addOrderMaterial(formData)`: 자재 추가
     - Zod 검증, getUser() 인증
     - 초기값: used_quantity, held_quantity, shortage_quantity = 0
  3. `updateOrderMaterial(id, data)`: 자재 수량/메모 수정
     - planned_quantity, memo 수정 지원
  4. `removeOrderMaterial(id)`: 자재 제거
     - CASCADE DELETE (DB 제약조건)
  5. `getOrderMaterialSummary(orderId)`: 자재 요약
     - total_planned, total_held, total_shortage 집계
     - 자재 목록 포함

### 3. 인증 및 권한
- 모든 액션에서 `getUser()` 인증 확인
- `user_id` 필터로 사용자별 데이터 격리
- RLS 정책 적용 (DB 레벨)

### 4. 캐시 갱신
- `revalidatePath('/orders')`: 수주 목록 캐시 갱신
- `revalidatePath('/orders/[orderId]')`: 개별 수주 캐시 갱신

### 5. 빌드 확인
- `npm run build` 성공
- TypeScript 에러 0개
- LSP 진단 에러 0개

## 주요 결정사항

### 1. product join 패턴
- Supabase 관계형 쿼리 사용
- `product:products(id, name, category, sku, unit)` 문법
- 타입: `OrderMaterialWithProduct` 인터페이스 정의

### 2. 집계 로직
- `getOrderMaterialSummary`: 클라이언트 측 집계 (Array.reduce)
- DB 집계 함수 미사용 (간단한 로직이므로)

### 3. 에러 처리
- 한국어 에러 메시지
- console.error로 디버깅 정보 출력
- ActionResult<T> 타입으로 일관된 응답 포맷

### 4. 기타 파일 발견
빌드 중 다음 파일들도 커밋에 포함됨 (이전 작업 결과):
- `src/app/(dashboard)/inventory/actions.ts`
- `src/app/(dashboard)/schedule/actions.ts`
- `src/lib/schemas/inventory.ts`
- `src/lib/schemas/product.ts`
- `src/lib/schemas/schedule.ts`
- `src/lib/utils/date.ts`
- `src/lib/utils/schedule-conflict.ts`

## 알려진 이슈
없음.

## 다음 단계

### 프론트엔드 구현
1. 수주 상세 페이지에서 자재 목록 표시
2. 자재 추가/수정/삭제 UI 구현
3. hold/shortage 수량 시각화 (배지, 색상)
4. 자재 요약 카드 (총 계획/hold/shortage)

### 테스트
1. 자재 CRUD 기능 테스트
2. product join 동작 확인
3. 권한 체크 (다른 사용자 데이터 접근 불가)

## 파일 목록
- `/root/project/project-ulju-a/src/lib/schemas/order-material.ts`
- `/root/project/project-ulju-a/src/app/(dashboard)/orders/material-actions.ts`
- `/root/project/project-ulju-a/src/lib/schemas/index.ts` (수정)

## 커밋 정보
- **커밋 해시**: c1bca4d
- **커밋 메시지**: `feat(orders): 수주별 자재 관리 (order_materials) CRUD Server Actions`
- **푸시 완료**: origin/master
