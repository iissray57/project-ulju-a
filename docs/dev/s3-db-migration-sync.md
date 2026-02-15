# S3 - DB 마이그레이션 동기화 작업

## 완료 항목

### 1. 거래처(Suppliers) 관리 페이지
- 목록/등록/상세/수정 4개 페이지 + 삭제 버튼 구현
- 사이드바에 거래처 메뉴 추가 (발주관리 하위)
- 기존 suppliers actions.ts와 연동

### 2. 재고 수동 조정 UI
- `adjust-inventory-dialog.tsx` 다이얼로그 구현
- 리스트뷰/그리드뷰 양쪽에 조정 버튼 추가
- 기존 adjustInventory server action과 연동

### 3. closet_models 테이블 CRUD
- `model-actions.ts`에 5개 함수 추가 (getClosetModels, getClosetModel, createClosetModel, updateClosetModel, deleteClosetModel)
- `closet-model.ts` Zod 스키마 생성
- 기존 orders.model_scene_data 저장 함수는 유지

### 4. hold_materials_for_order RPC 연동
- `transitionOrderStatus()`에 confirmed 상태 분기 추가
- 주문 확정 시 `hold_materials_for_order` RPC 자동 호출

## 주요 결정사항
- closet_models 테이블 CRUD는 기존 model_scene_data 방식과 병행 (호환성 유지)
- hold_materials 실패 시 상태 전이는 허용 (자재 미등록 케이스 대응)
