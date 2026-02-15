# User Preferences

## Communication Style
- 긍정 편향 금지: 무조건 동의하거나 "좋은 질문입니다" 같은 빈말을 하지 않는다. 솔직하고 직접적으로 답변한다.
- 질문 분석 우선: 요청을 받으면 바로 실행하지 말고, 먼저 요청의 의도와 범위를 분석한다.
- 불명확한 부분은 반드시 질문: 확실하지 않은 부분, 여러 해석이 가능한 부분, 빠진 정보가 있으면 작업 전에 사용자에게 확인한다.
- 문제점 지적: 요청에 잠재적 문제, 더 나은 대안, 또는 놓친 부분이 있으면 솔직하게 말한다.
- 모르는 것은 모른다고 말한다: 추측으로 답변하지 않는다.
- 간결 보고: 처리 과정은 생략하고 완료/실패 결과만 아주 간단하게 보고한다. 컴팩트 이슈 방지.

# Project: UljuAngle (울주앵글)

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

## Development Workflow (팀 기반 단위작업 프로세스)

모든 단위작업(task)은 3-팀 파이프라인으로 처리한다:

### 팀 구성
- **개발팀** (executor/build-fixer): 구현 + 빌드 에러 수정
- **QA팀** (qa-tester/verifier): 빌드 검증 + 수용 기준 테스트 + 회귀 테스트
- **보고서팀** (writer): `docs/dev/` 보고서 작성 + 커밋 & 푸시

### 실행 순서
1. **개발팀**: 계획서 수용 기준 충족 구현, TypeScript strict 오류 없음
2. **QA팀**: `npm run build` 성공 + 기능 동작 + 회귀 없음 확인
3. **보고서팀**: `docs/dev/{sprint}-{task}-{제목}.md` 간결 작성 → atomic commit → `git push origin`

### 보고서 규칙
- 파일명: `{sprint}-{task}-{제목}.md` (예: `s1-t01-project-init.md`)
- 내용: 완료 항목, 주요 결정사항만 간결하게. 불필요한 설명 제거.
- 커밋 메시지: `feat(scope): 설명` / `fix(scope): 설명`

### 팀 실행 방식
- OMC team 모드 또는 순차 에이전트 위임으로 처리
- 태스크 간 독립적이면 병렬 처리, 의존성 있으면 순차 처리

## Conventions
- 한국어 UI 텍스트, 영어 코드/변수명
- Server Component 우선, 필요 시에만 "use client"
- 파일명: kebab-case (예: `order-pipeline.tsx`)
- 컴포넌트명: PascalCase (예: `OrderPipeline`)
- Supabase Auth: 반드시 `getUser()` 사용 (getSession 금지)

## Development Server
- 개발 서버 포트: **3031** (`npm run dev -- -p 3031`)
- 테스트 URL: http://localhost:3031
