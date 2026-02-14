# Sprint 1 - Task 1.7: Supabase Auth 연동

## 작업 요약
@supabase/ssr 기반 인증 클라이언트 유틸리티, 로그인 페이지, Server Actions 구현.

## 구현 내역

### 설치된 패키지
- `@supabase/supabase-js@^2.95.3`
- `@supabase/ssr@^0.8.0`

### 생성 파일
| 파일 | 설명 |
|------|------|
| `src/lib/supabase/client.ts` | 브라우저 클라이언트 (createBrowserClient) |
| `src/lib/supabase/server.ts` | 서버 클라이언트 (createServerClient + cookies) |
| `src/lib/supabase/middleware.ts` | 미들웨어 클라이언트 (updateSession + getUser) |
| `src/app/(auth)/layout.tsx` | 인증 페이지 레이아웃 (중앙 정렬) |
| `src/app/(auth)/login/page.tsx` | 이메일/비밀번호 로그인 폼 (회원가입 토글) |
| `src/app/(auth)/login/actions.ts` | Server Actions (signIn, signUp, signOut) |
| `src/app/auth/callback/route.ts` | OAuth/Magic Link 콜백 핸들러 |

### 보안 구현
- 서버 측 인증 검증에 `getUser()` 사용 (getSession 대신)
- Supabase 공식 보안 권장사항 준수

## QA 결과
| 항목 | 결과 |
|------|------|
| `npm run build` | PASS |
| `npm run lint` | PASS |
| LSP 진단 (client.ts) | CLEAN |
| LSP 진단 (server.ts) | CLEAN |
| LSP 진단 (middleware.ts) | CLEAN |
| LSP 진단 (login/page.tsx) | CLEAN |
| LSP 진단 (login/actions.ts) | CLEAN |
