# UI 화면 테스트 보고서 및 개발 요청

**테스트 일시**: 2026-02-14
**테스트 범위**: 전체 22개 페이지
**테스트 방식**: Playwright 브라우저 테스트

---

## 테스트 결과 요약

| 항목 | 결과 |
|------|------|
| 총 페이지 | 22개 |
| 성공 | 22개 |
| 발견된 문제 | 2건 |

---

## 개발 요청 사항

### DEV-001: E2E 테스트 선택자 수정 (Low)

**문제**: 로그인 페이지 토글 버튼 텍스트와 E2E 테스트 선택자 불일치

**현재 구현** (`src/app/(auth)/login/page.tsx:76-78`):
```typescript
{isSignUp
  ? '이미 계정이 있으신가요? 로그인'
  : '계정이 없으신가요? 회원가입'}
```

**테스트 기대값**:
- `button:has-text("계정이 없으신가요?")`
- `button:has-text("이미 계정이 있으신가요?")`

**영향받는 테스트 파일**:
- `business-flow.spec.ts:60`
- `navigation.spec.ts:190, 209`
- `order-lifecycle.spec.ts:72`

**요청 작업**: 테스트 선택자를 실제 구현에 맞게 수정

---

### DEV-002: 정적 리소스 404 조사 (Medium)

**문제**: 일부 페이지에서 Next.js 정적 리소스 404 에러

**영향받는 페이지**:
- /schedule
- /inventory
- /customers
- /orders/1/edit
- /purchases/1/receive

**404 발생 리소스**:
- `/_next/static/css/app/layout.css`
- `/_next/static/chunks/main-app.js`
- `/_next/static/chunks/app-pages-internals.js`

**참고**:
- 개발 서버 HMR 관련 이슈로 추정
- 페이지 기능에는 영향 없음
- 프로덕션 빌드에서 재현 여부 확인 필요

**요청 작업**: 프로덕션 빌드 후 동일 문제 발생 여부 확인

---

## 정상 동작 확인된 항목

- 모든 페이지 로드 정상
- 인증 리다이렉트 정상 작동
- 로그인 폼 요소 정상 렌더링
- 네트워크 에러 없음 (404 제외)
