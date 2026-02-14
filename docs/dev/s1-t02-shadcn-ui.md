# Sprint 1 - Task 1.2: shadcn/ui 설치 및 기본 컴포넌트 셋업

## 작업 요약
shadcn/ui 초기화 및 Phase 1에 필요한 기본 컴포넌트 설치.

## 구현 내역

### 생성/수정 파일
| 파일 | 설명 |
|------|------|
| `components.json` | shadcn/ui 설정 (new-york style, RSC, TS) |
| `src/lib/utils.ts` | `cn()` 유틸리티 (clsx + tailwind-merge) |
| `src/components/ui/*.tsx` | 9개 기본 컴포넌트 |
| `src/app/globals.css` | shadcn CSS 변수 + 다크모드 지원 |

### 설치된 컴포넌트 (9개)
- button, input, card, dialog, dropdown-menu
- badge, separator, sheet, sonner (toast)

### 추가된 의존성
- `class-variance-authority@^0.7.1`
- `clsx@^2.1.1`
- `lucide-react@^0.564.0`
- `radix-ui@^1.4.3` (unified package)
- `tailwind-merge@^3.4.0`

### CSS 설정 (globals.css)
- `@import "shadcn/tailwind.css"` 추가
- `@custom-variant dark (&:is(.dark *))` 다크모드
- `@theme inline` 블록에 30+ 색상 변수 (oklch)
- `:root` / `.dark` 컬러 스킴

## QA 결과
| 항목 | 결과 |
|------|------|
| `npm run build` | PASS (8 pages) |
| `npm run lint` | PASS |
| 컴포넌트 파일 존재 | PASS (9개) |
| Tailwind v4 호환 | PASS |
| 다크모드 CSS 변수 | PASS |
