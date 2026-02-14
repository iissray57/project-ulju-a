# S1-T08: Next.js 미들웨어 설정

## 완료 항목
- 미인증 사용자 → `/login` 리다이렉트 (redirect 파라미터 보존)
- 인증 사용자의 `/login` 접근 → 원래 경로로 리다이렉트
- 정적 에셋/API 라우트 Auth 체크 스킵
- Public 라우트: `/login`, `/auth/callback`, `/offline`

## 주요 결정사항
- `updateSession()`으로 Supabase 세션 갱신 후 `user` 객체로 인증 판단
- matcher로 정적 파일 제외

## 파일
- `src/middleware.ts`
