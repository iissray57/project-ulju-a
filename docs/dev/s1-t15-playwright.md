# Sprint 1 - Task 1.15: Playwright 초기 설정

## 작업 요약
@playwright/test 설치, 설정 파일 생성, 스모크 테스트 작성 및 실행 확인.

## 구현 내역

### 설치된 패키지
- `@playwright/test` (devDependencies)

### 생성 파일
| 파일 | 설명 |
|------|------|
| `playwright.config.ts` | Playwright 설정 (chromium only, Phase 1) |
| `tests/e2e/smoke.spec.ts` | 스모크 테스트 (홈페이지 로딩 확인) |

### 주요 설정 (playwright.config.ts)
- **testDir**: ./tests/e2e
- **projects**: chromium only (Phase 1)
- **baseURL**: http://localhost:3000
- **webServer**: npm run dev (자동 시작)
- **retries**: CI 환경에서만 2회
- **reporter**: html

### package.json 스크립트
```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

## QA 결과
| 항목 | 결과 |
|------|------|
| playwright.config.ts 존재 | PASS |
| smoke.spec.ts 존재 | PASS |
| `npx playwright test` | PASS (1 passed, 8.6s) |
| package.json 스크립트 | PASS |
