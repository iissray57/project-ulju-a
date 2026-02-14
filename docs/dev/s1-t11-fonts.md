# Sprint 1 - Task 1.11: 폰트 설치 및 설정

## 작업 요약
Pretendard Variable (한글 주 폰트), Inter (영문 폴백), JetBrains Mono (모노스페이스) 설치 및 next/font 연동.

## 구현 내역

### 설치된 패키지
- `pretendard@^1.3.9` (npm, woff2 포함)

### 수정 파일
| 파일 | 설명 |
|------|------|
| `src/app/layout.tsx` | 3개 폰트 import 및 CSS variable 적용 |
| `src/app/globals.css` | @theme inline 블록에 폰트 패밀리 등록 |
| `package.json` | pretendard 의존성 추가 |

### 폰트 설정 상세
| 폰트 | 로드 방식 | CSS Variable |
|------|-----------|-------------|
| Pretendard Variable | next/font/local (woff2) | --font-pretendard |
| Inter | next/font/google | --font-inter |
| JetBrains Mono | next/font/google | --font-mono-jb |

### Tailwind v4 CSS 연동
```css
@theme inline {
  --font-sans: var(--font-pretendard), var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-mono-jb), ui-monospace, monospace;
}
```

## QA 결과
| 항목 | 결과 |
|------|------|
| `npm run build` | PASS |
| Pretendard woff2 로드 | PASS |
| CSS variable 등록 | PASS |
| body className 적용 | PASS |
