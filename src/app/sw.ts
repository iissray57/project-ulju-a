import type {
  PrecacheEntry,
  RuntimeCaching,
  SerwistGlobalConfig,
} from 'serwist';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'serwist';
import { Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope;

// App Shell 및 정적 자산 캐싱 전략
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
      plugins: [
        {
          cacheWillUpdate: async ({ response }) => {
            // 200-299, 0 (opaque) 응답만 캐시
            return response && (response.ok || response.status === 0)
              ? response
              : null;
          },
        },
      ],
    }),
  },

  // 이미지: CacheFirst (30일 만료)
  {
    matcher: ({ request }) => request.destination === 'image',
    handler: new CacheFirst({
      cacheName: 'image-cache',
      plugins: [
        {
          cacheWillUpdate: async ({ response }) => {
            return response && response.ok ? response : null;
          },
          cachedResponseWillBeUsed: async ({ cachedResponse }) => {
            // 30일 후 만료
            if (!cachedResponse) return null;
            const dateHeader = cachedResponse.headers.get('date');
            if (!dateHeader) return cachedResponse;
            const fetchDate = new Date(dateHeader).getTime();
            const now = Date.now();
            const maxAge = 30 * 24 * 60 * 60 * 1000; // 30일
            return now - fetchDate > maxAge ? null : cachedResponse;
          },
        },
      ],
    }),
  },

  // 페이지 내비게이션: StaleWhileRevalidate
  {
    matcher: ({ request }) => request.mode === 'navigate',
    handler: new StaleWhileRevalidate({
      cacheName: 'page-cache',
      plugins: [
        {
          cacheWillUpdate: async ({ response }) => {
            return response && response.ok ? response : null;
          },
        },
      ],
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
      plugins: [
        {
          cacheWillUpdate: async ({ response }) => {
            return response && response.ok ? response : null;
          },
        },
      ],
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
});

serwist.addEventListeners();
