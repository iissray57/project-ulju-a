# S1-T05: RLS 정책 설정

## 완료 항목
- 13개 Phase 1 테이블에 RLS 활성화
- `user_id = auth.uid()` 기반 데이터 격리 정책 적용
- `report_templates`: 기본 템플릿(`is_default=TRUE`) 전체 읽기 허용 + 사용자 본인 CRUD 분리 정책

## 주요 결정사항
- 모든 테이블에 동일한 `FOR ALL` 정책 적용 (SELECT/INSERT/UPDATE/DELETE 통합)
- `report_templates`만 SELECT/INSERT/UPDATE/DELETE 개별 정책으로 분리

## 파일
- `supabase/migrations/20260214130000_rls_policies.sql`
