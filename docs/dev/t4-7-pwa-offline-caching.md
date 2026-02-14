# T4.7 PWA 앱 셸 오프라인 캐싱 강화

**작업일**: 2026-02-14
**담당**: executor
**상태**: ✅ 완료

## 개요

PWA 오프라인 캐싱 설정을 강화하고 앱 셸(레이아웃, 기본 페이지) 캐싱 전략을 개선했습니다.

## 완료 항목

### 1. 서비스 워커 캐싱 전략 강화 (`src/app/sw.ts`)

**변경 전**: `defaultCache` 사용 (기본 설정)

**변경 후**: 4가지 세분화된 캐싱 전략 적용

```typescript
const runtimeCaching: RuntimeCaching[] = [
  // API 호출: NetworkFirst (5초 타임아웃 후 캐시)
  {
    matcher: ({ url, sameOrigin }) =>
      sameOrigin &&
      (url.pathname.startsWith('/api/') ||
        url.pathname.includes('/auth/') ||
        url.pathname.includes('/rest/v1/')),
    handler: new NetworkFirst({
      cacheName: 'api-cache',
      networkTimeoutSeconds: 5,
      plugins: [/* 200-299, 0 응답만 캐시 */],
    }),
  },

  // 이미지: CacheFirst (30일 만료)
  {
    matcher: ({ request }) => request.destination === 'image',
    handler: new CacheFirst({
      cacheName: 'image-cache',
      plugins: [/* 30일 후 만료 로직 */],
    }),
  },

  // 페이지 내비게이션: StaleWhileRevalidate
  {
    matcher: ({ request }) => request.mode === 'navigate',
    handler: new StaleWhileRevalidate({
      cacheName: 'page-cache',
      plugins: [/* 200 응답만 캐시 */],
    }),
  },

  // 정적 자산 (JS, CSS, 폰트): CacheFirst
  {
    matcher: ({ request, url }) =>
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'font' ||
      url.pathname.startsWith('/_next/static/'),
    handler: new CacheFirst({
      cacheName: 'static-assets',
      plugins: [/* 200 응답만 캐시 */],
    }),
  },
];
```

**오프라인 폴백 추가**:
```typescript
fallbacks: {
  entries: [
    {
      url: '/offline',
      matcher: ({ request }) => request.destination === 'document',
    },
  ],
}
```

### 2. 오프라인 페이지 개선 (`src/app/offline/page.tsx`)

**변경 전**: 정적 메시지만 표시

**변경 후**: 인터랙티브 오프라인 페이지
- 실시간 온라인/오프라인 상태 감지
- 마지막 온라인 시간 표시 (localStorage 활용)
- "다시 시도" 버튼 추가
- 브랜드 아이콘 (SVG 오프라인 아이콘)
- 상태 인디케이터 (빨강/초록 점)

**주요 기능**:
```typescript
useEffect(() => {
  // 온라인 상태 모니터링
  const handleOnline = () => {
    setIsOnline(true);
    localStorage.setItem('lastOnlineTime', new Date().toISOString());
  };
  window.addEventListener('online', handleOnline);

  // 오프라인 전환 감지
  const handleOffline = () => setIsOnline(false);
  window.addEventListener('offline', handleOffline);
}, []);
```

### 3. 메타데이터 구조 개선

**문제**: `'use client'`와 `export const metadata`를 함께 사용할 수 없음

**해결**: `src/app/offline/layout.tsx` 생성
```typescript
export const metadata: Metadata = {
  title: '오프라인 - ClosetBiz',
  description: '오프라인 모드',
};
```

### 4. 동적 라우트 처리

**문제**: 대시보드 페이지 빌드 오류 (Dynamic server usage: cookies)

**해결**: `src/app/(dashboard)/page.tsx`에 추가
```typescript
export const dynamic = 'force-dynamic';
```

## 빌드 검증

```bash
npm run build
```

**결과**: ✅ 성공
- TypeScript 타입 체크: 0 errors
- 빌드 출력: 17개 라우트 생성
- 서비스 워커: `/public/sw.js` (37KB) 생성 완료
- 프리캐시 엔트리: 54개 정적 자산

## 기술 결정사항

### 1. 캐싱 전략 선택 근거

| 리소스 타입 | 전략 | 이유 |
|------------|------|------|
| API 호출 | NetworkFirst (5s) | 최신 데이터 우선, 오프라인 시 캐시 사용 |
| 이미지 | CacheFirst (30d) | 불변 리소스, 빠른 로딩 |
| 페이지 | StaleWhileRevalidate | 빠른 응답 + 백그라운드 갱신 |
| 정적 자산 | CacheFirst | 불변 리소스 (hash fingerprint) |

### 2. Serwist API 변경사항

- ~~`urlPattern`~~ → `matcher` (정확한 Serwist 타입)
- ~~`self.location.origin`~~ → `sameOrigin` (WorkerGlobalScope 제약)

### 3. 오프라인 UX 설계

- **목표**: 사용자에게 명확한 상태 피드백
- **수단**: 실시간 상태 표시 + 재시도 액션
- **브랜딩**: ClosetBiz 메시지 유지

## 알려진 제약사항

### 1. PWA 아이콘 누락

**상태**: 아이콘 파일이 없음 (`/public/icons/` 디렉터리 비어있음)

**필요 작업**:
```bash
# 필요한 아이콘 파일
/public/icons/icon-192.png  # 192x192
/public/icons/icon-512.png  # 512x512
```

**권장 도구**: https://realfavicongenerator.net/

**영향**: PWA 설치 시 기본 아이콘 표시

### 2. 오프라인 기능 제한

- **IndexedDB 미활용**: 현재는 HTTP 캐시만 사용
- **백그라운드 동기화 미구현**: 오프라인 작업 큐잉 없음
- **낙관적 UI 없음**: 오프라인 시 쓰기 작업 불가

## 다음 단계

### 즉시 (차단 요소)
- [ ] PWA 아이콘 생성 및 배포

### 향후 개선 (선택 사항)
- [ ] Background Sync API 활용 (오프라인 작업 큐)
- [ ] IndexedDB 기반 로컬 우선 데이터 저장소
- [ ] Push Notification 지원
- [ ] 오프라인 전용 읽기 모드 UI

## 참고 자료

- Serwist 공식 문서: https://serwist.pages.dev/
- Next.js PWA 가이드: https://nextjs.org/docs/app/building-your-application/configuring/progressive-web-apps
- Web.dev PWA 패턴: https://web.dev/learn/pwa/

## 변경 파일 목록

- `src/app/sw.ts` - 캐싱 전략 강화
- `src/app/offline/page.tsx` - 인터랙티브 오프라인 페이지
- `src/app/offline/layout.tsx` - 메타데이터 분리
- `src/app/(dashboard)/page.tsx` - 동적 라우트 설정
- `public/icons/.gitkeep` - 아이콘 디렉터리 플레이스홀더

---

**검증 완료**: ✅ 빌드 성공, 타입 체크 통과, LSP 진단 클린
