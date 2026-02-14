# Sprint 1 - Task 1.12: PWA 기본 설정

## 작업 요약
@serwist/next 기반 PWA 설정. Service Worker, Web App Manifest, 오프라인 폴백 페이지 구현.

## 구현 내역

### 설치된 패키지
- `@serwist/next` (devDependencies)
- `serwist` (dependencies)

### 생성/수정 파일
| 파일 | 설명 |
|------|------|
| `next.config.ts` | withSerwist 래퍼 추가 (Three.js externals 보존) |
| `src/app/sw.ts` | Service Worker (precache, skipWaiting, clientsClaim, navigationPreload) |
| `src/app/manifest.ts` | PWA manifest (name: ClosetBiz, standalone, dark theme) |
| `src/app/offline/page.tsx` | 오프라인 폴백 페이지 |
| `public/icons/.gitkeep` | PWA 아이콘 placeholder |

### Manifest 설정
- **name**: ClosetBiz - 옷장 업무 관리
- **display**: standalone
- **background_color**: #0A0A0F
- **theme_color**: #6366F1

### Service Worker
- Precache + Runtime Caching (defaultCache)
- Skip Waiting + Clients Claim
- Navigation Preload 활성화

## QA 결과
| 항목 | 결과 |
|------|------|
| `npm run build` | PASS |
| SW 번들링 | PASS (/sw.js 생성) |
| manifest.webmanifest 라우트 | PASS |
| /offline 페이지 | PASS |
| TypeScript 컴파일 | PASS (tsc --noEmit) |
| Three.js externals 보존 | PASS |
