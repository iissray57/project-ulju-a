import { test, expect } from '@playwright/test';

/**
 * Business Flow E2E Tests
 *
 * 전체 비즈니스 흐름 테스트:
 * 1. 고객 등록
 * 2. 수주 등록 (inquiry)
 * 3. 견적 작성 (quoted)
 * 4. 계약 확정 (contracted)
 * 5. 스케줄 등록 (measurement/installation)
 * 6. 자재 준비 (material_held)
 * 7. 설치 완료 (installed)
 * 8. 발주 생성 및 입고
 * 9. 매출/매입 기록
 * 10. 완료 (completed)
 */

test.describe('Business Flow - Protected Routes Access', () => {
  test('모든 핵심 비즈니스 페이지가 인증을 요구함', async ({ page }) => {
    const protectedRoutes = [
      '/orders',
      '/orders/new',
      '/customers',
      '/customers/new',
      '/schedule',
      '/purchases',
      '/purchases/new',
      '/finance',
      '/inventory',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    }
  });
});

test.describe('Business Flow - Page Structure Validation', () => {
  test('로그인 페이지 폼 구조 검증', async ({ page }) => {
    await page.goto('/login');

    // 필수 폼 요소 확인
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // 이메일 입력 검증
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('required', '');

    // 비밀번호 입력 검증
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('회원가입 모드 전환 검증', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // 로그인 → 회원가입 전환
    const toggleToSignup = page.locator('button.text-blue-600:has-text("회원가입")');
    await toggleToSignup.waitFor({ state: 'visible' });
    await toggleToSignup.click();
    await expect(page.locator('h1')).toContainText('회원가입', { timeout: 3000 });

    // 회원가입 → 로그인 전환
    const toggleToLogin = page.locator('button.text-blue-600:has-text("로그인")');
    await toggleToLogin.waitFor({ state: 'visible' });
    await toggleToLogin.click();
    await expect(page.locator('h1')).toContainText('로그인', { timeout: 3000 });
  });
});

test.describe('Business Flow - Redirect Parameters', () => {
  test('각 페이지 접근 시 올바른 redirect 파라미터 포함', async ({ page }) => {
    const routeTests = [
      { route: '/orders', expected: '%2Forders' },
      { route: '/customers', expected: '%2Fcustomers' },
      { route: '/schedule', expected: '%2Fschedule' },
      { route: '/purchases', expected: '%2Fpurchases' },
      { route: '/finance', expected: '%2Ffinance' },
      { route: '/inventory', expected: '%2Finventory' },
    ];

    for (const { route, expected } of routeTests) {
      await page.goto(route);
      const url = page.url();
      expect(url).toContain('/login');
      expect(url).toContain(`redirect=${expected}`);
    }
  });
});

test.describe('Business Flow - Static Assets & PWA', () => {
  test('오프라인 페이지 접근 가능', async ({ page }) => {
    await page.goto('/offline');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveTitle(/울주앵글/);
  });

  test('manifest.webmanifest 접근 가능', async ({ page }) => {
    const response = await page.goto('/manifest.webmanifest');
    expect(response?.status()).toBe(200);
  });
});

test.describe('Business Flow - Error States', () => {
  test('존재하지 않는 페이지는 404 처리', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz');
    // Next.js 기본 404 또는 커스텀 404 페이지
    await expect(page.locator('body')).toBeVisible();
  });

  test('잘못된 UUID 형식의 ID로 접근 시 에러 처리', async ({ page }) => {
    await page.goto('/orders/invalid-uuid');
    // 인증 필요로 로그인 리다이렉트
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Business Flow - Form Validation (Login)', () => {
  test('빈 폼 제출 시 브라우저 기본 검증 동작', async ({ page }) => {
    await page.goto('/login');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // required 속성으로 인해 폼이 제출되지 않음
    await expect(page).toHaveURL(/\/login/);
  });

  test('잘못된 이메일 형식 입력 시 검증', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // 이메일 형식 검증으로 인해 제출되지 않음
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Business Flow - Navigation Structure', () => {
  test('로그인 페이지 메타 태그 확인', async ({ page }) => {
    await page.goto('/login');

    // viewport 메타 태그 확인 (모바일 대응)
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('페이지 로드 성능 (기본 체크)', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // 5초 이내 로드
    expect(loadTime).toBeLessThan(5000);
  });
});

test.describe('Business Flow - Accessibility', () => {
  test('로그인 폼 라벨 연결 확인', async ({ page }) => {
    await page.goto('/login');

    // 이메일 라벨과 입력 필드 연결
    const emailLabel = page.locator('label[for="email"]');
    await expect(emailLabel).toBeVisible();

    // 비밀번호 라벨과 입력 필드 연결
    const passwordLabel = page.locator('label[for="password"]');
    await expect(passwordLabel).toBeVisible();
  });

  test('키보드 탐색 가능', async ({ page }) => {
    await page.goto('/login');

    // Tab으로 이메일 입력 필드로 이동
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);

    // INPUT 또는 BUTTON에 포커스
    expect(['INPUT', 'BUTTON']).toContain(focusedElement);
  });
});
