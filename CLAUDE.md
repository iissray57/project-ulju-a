# User Preferences

## Communication Style
- 긍정 편향 금지: 무조건 동의하거나 "좋은 질문입니다" 같은 빈말을 하지 않는다. 솔직하고 직접적으로 답변한다.
- 질문 분석 우선: 요청을 받으면 바로 실행하지 말고, 먼저 요청의 의도와 범위를 분석한다.
- 불명확한 부분은 반드시 질문: 확실하지 않은 부분, 여러 해석이 가능한 부분, 빠진 정보가 있으면 작업 전에 사용자에게 확인한다.
- 문제점 지적: 요청에 잠재적 문제, 더 나은 대안, 또는 놓친 부분이 있으면 솔직하게 말한다.
- 모르는 것은 모른다고 말한다: 추측으로 답변하지 않는다.

# Project: ClosetBiz (클로젯비즈)

## Tech Stack
- Next.js 15 App Router + React 19 + TypeScript
- Tailwind CSS v4 (CSS-first @theme)
- shadcn/ui (Atoms layer) + Radix UI
- Supabase (PostgreSQL, Auth, Storage, RLS, RPC)
- @tanstack/react-query + react-hook-form + zod
- PWA via @serwist/next
- Three.js (React Three Fiber) for 2D/3D modeling

## Plan Documents (참조)
- `.omc/plans/closet-biz-system-final.md` - 시스템 아키텍처 + DB + 비즈니스 로직
- `.omc/plans/dark-mode-multiview-ux-design.md` - 다크모드 + 다중뷰 UX
- `.omc/plans/closet-biz-frontend-design.md` - 프론트엔드 구현 설계

## Development Workflow (단위작업 프로세스)

모든 단위작업(task)은 아래 순서를 반드시 따른다:

### 1. 구현 (Implement)
- 계획서의 해당 태스크 수용 기준(Acceptance Criteria)을 충족하도록 구현
- 코드 품질: ESLint/Prettier 통과, TypeScript strict 오류 없음

### 2. QA 테스트 (Test)
- qa-tester 에이전트로 구현 결과 검증
- 빌드 성공 확인 (`npm run build`)
- 기능 동작 확인 (해당 태스크의 수용 기준 기반)
- 기존 기능 회귀 없음 확인

### 3. 보고서 작성 (Report)
- `docs/dev/` 디렉터리에 마크다운 보고서 작성
- 파일명: `{sprint}-{task}-{제목}.md` (예: `s1-t01-project-init.md`)
- 내용: 완료 항목, 주요 결정사항, 알려진 이슈, 다음 단계

### 4. 커밋 & 푸시 (Commit & Push)
- 단위작업별 atomic commit
- 커밋 메시지 형식: `feat(scope): 설명` / `fix(scope): 설명`
- 커밋 후 즉시 `git push origin` 실행

## Conventions
- 한국어 UI 텍스트, 영어 코드/변수명
- Server Component 우선, 필요 시에만 "use client"
- 파일명: kebab-case (예: `order-pipeline.tsx`)
- 컴포넌트명: PascalCase (예: `OrderPipeline`)
- Supabase Auth: 반드시 `getUser()` 사용 (getSession 금지)
