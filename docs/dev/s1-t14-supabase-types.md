# S1-T14: Supabase 타입 자동 생성 설정

## 완료 항목
- `npm run db:gen-types` 스크립트 설정 (`supabase gen types typescript --local`)
- 로컬 Supabase에서 TypeScript 타입 자동 생성 완료
- 모든 Phase 1 테이블(customers, orders, products, inventory 등) + RPC 함수 타입 포함

## 주요 결정사항
- 타입 파일 경로: `src/lib/database.types.ts`
- 자동 생성 파일이므로 수동 편집 금지 (스키마 변경 시 `npm run db:gen-types` 재실행)

## 파일
- `src/lib/database.types.ts`
