# Sprint 1 - Task 1.1: Next.js 15 프로젝트 초기화

## 작업 요약
Next.js 15 App Router + TypeScript strict 모드 + Tailwind CSS v4 기반 프로젝트 초기 구조 생성.

## 구현 내역

### 설치된 패키지
- next@15, react@19, react-dom@19
- typescript@5, @types/react, @types/node
- tailwindcss@4, @tailwindcss/postcss, tw-animate-css
- eslint, eslint-config-next, eslint-config-prettier, prettier

### 생성된 파일
| 파일 | 설명 |
|------|------|
| `package.json` | 프로젝트 메타데이터 + 스크립트 |
| `tsconfig.json` | TypeScript strict 설정, `@/*` → `./src/*` alias |
| `next.config.ts` | Three.js SSR 방지 externals 포함 |
| `postcss.config.mjs` | Tailwind v4 CSS-first 방식 |
| `.eslintrc.json` | next/core-web-vitals + prettier |
| `.prettierrc` | singleQuote, semi, tabWidth 2 |
| `src/app/globals.css` | `@import "tailwindcss"` + `tw-animate-css` |
| `src/app/layout.tsx` | Root layout (lang="ko", metadata) |
| `src/app/page.tsx` | 랜딩 페이지 placeholder |

### 주요 설정
- **TypeScript**: strict mode 활성화
- **Tailwind CSS v4**: CSS-first config (`@theme` 방식, `tailwind.config.ts` 미사용)
- **Path alias**: `@/*` → `./src/*`
- **Three.js**: canvas SSR 방지를 위한 webpack externals 설정

## QA 결과
| 항목 | 결과 |
|------|------|
| `npm run build` | PASS (4 static pages) |
| `npm run lint` | PASS (no warnings) |
| TypeScript strict | CONFIRMED |
| Tailwind v4 파일 | CONFIRMED |
| 파일 구조 | CONFIRMED |

## 비고
- `create-next-app`이 기존 파일(CLAUDE.md, .gitignore 등)로 인해 실패하여 수동 초기화 진행
- next-env.d.ts는 Next.js 빌드 시 자동 생성됨
