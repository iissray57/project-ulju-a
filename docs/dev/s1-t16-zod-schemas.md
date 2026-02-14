# Sprint 1 - Task 1.16: Zod 스키마 정의

## 작업 요약
Zod v4 설치 및 closet spec 스키마, 주문 상태 전환 규칙 정의.

## 구현 내역

### 설치된 패키지
- `zod@^4.3.6`

### 생성 파일
| 파일 | 설명 |
|------|------|
| `src/lib/schemas/closet-spec.ts` | 옷장 사양 Zod 스키마 |
| `src/lib/schemas/order-status.ts` | 주문 상태 ENUM + 전환 규칙 |
| `src/lib/schemas/index.ts` | Barrel export |

### closet-spec.ts
- `closetSectionSchema`: type (shelf/hanger/drawer/open), width, position, 옵션 수량
- `closetSpecSchema`: width, height, depth, sections, frame_type, color, material, door_type, notes
- 타입 export: `ClosetSpec`, `ClosetSection`

### order-status.ts
- `ORDER_STATUS`: DB ENUM과 동일한 10개 상태
- `ORDER_TRANSITIONS`: 각 상태별 forward/backward/cancel 가능 상태
- `canTransition()`: 상태 전환 유효성 검증 함수
- `ORDER_STATUS_LABELS`: 한국어 라벨 매핑

## QA 결과
| 항목 | 결과 |
|------|------|
| `npm run build` | PASS |
| Zod v4 설치 확인 | PASS (^4.3.6) |
| 스키마 파일 3개 | PASS |
| TypeScript 컴파일 | PASS |
| Barrel export 확인 | PASS |
