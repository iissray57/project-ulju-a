# Sprint 1 - Task 1.3: Supabase 로컬 개발 환경 설정

## 작업 요약
Supabase CLI 로컬 개발 환경 설정 및 환경 변수 구성.

## 구현 내역

### 생성/수정 파일
| 파일 | 설명 |
|------|------|
| `supabase/config.toml` | Supabase 로컬 설정 (DB 포트 5832) |
| `.env.example` | 환경 변수 템플릿 |
| `.env.local` | 로컬 환경 변수 (gitignore 대상) |

### 주요 설정
- **DB 포트**: 5832 (사용자 지정, 기본값 54322 대신)
- **Shadow DB 포트**: 5833
- **API 포트**: 54321
- **Studio 포트**: 54323
- **project_id**: `project-ulju-a`

### package.json 스크립트 추가
```json
{
  "db:start": "supabase start",
  "db:stop": "supabase stop",
  "db:reset": "supabase db reset",
  "db:gen-types": "supabase gen types typescript --local > src/types/supabase.ts",
  "db:migrate": "supabase migration new"
}
```

### 환경 변수 (.env.example)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase API URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 공개 anon key
- `SUPABASE_SERVICE_ROLE_KEY` - 서버 전용 service role key
- `DATABASE_URL` - PostgreSQL 직접 연결 (포트 5832)
- `NEXT_PUBLIC_KAKAO_MAP_KEY` - Kakao Maps API key

## QA 결과
| 항목 | 결과 |
|------|------|
| config.toml 포트 설정 | PASS (5832/5833) |
| .env.example 존재 | PASS |
| .env.local 존재 | PASS |
| DB 스크립트 등록 | PASS |
| .gitignore .env 제외 | PASS |

## 비고
- Supabase 서비스 실행(docker) 없이 설정 파일만 구성
- 실제 DB 연결 테스트는 Task 1.4 (스키마 마이그레이션) 시 수행 예정
