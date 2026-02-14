import { test, expect } from '@playwright/test';

/**
 * Navigation E2E Tests
 *
 * Tests page navigation, routing, and link functionality.
 * Tests run against unauthenticated state (login page).
 */

test.describe('Page Navigation - Public Routes', () => {
  test('/login 페이지로 직접 이동', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('h1')).toContainText('로그인');
  });

  test('/offline 페이지로 직접 이동', async ({ page }) => {
    await page.goto('/offline');

    await expect(page).toHaveURL(/\/offline/);
    await expect(page).toHaveTitle(/ClosetBiz/);
  });
});

test.describe('Page Navigation - Protected Routes Redirect', () => {
  test('/ 루트 경로는 /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login/);
  });

  test('/orders 경로는 /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/orders');

    await expect(page).toHaveURL(/\/login\?redirect=%2Forders/);
  });

  test('/customers 경로는 /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/customers');

    await expect(page).toHaveURL(/\/login\?redirect=%2Fcustomers/);
  });

  test('/schedule 경로는 /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/schedule');

    await expect(page).toHaveURL(/\/login\?redirect=%2Fschedule/);
  });

  test('/inventory 경로 접근 시도', async ({ page }) => {
    // Note: inventory route may or may not exist yet
    await page.goto('/inventory');

    // Should redirect to login (if protected) or 404 (if not implemented)
    const url = page.url();
    const isLoginRedirect = url.includes('/login');
    const is404 = await page.locator('text=404').isVisible().catch(() => false);

    expect(isLoginRedirect || is404).toBeTruthy();
  });
});

test.describe('Page Navigation - New Resource Routes', () => {
  test('/orders/new 경로는 /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/orders/new');

    await expect(page).toHaveURL(/\/login\?redirect=%2Forders%2Fnew/);
  });

  test('/customers/new 경로는 /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/customers/new');

    await expect(page).toHaveURL(/\/login\?redirect=%2Fcustomers%2Fnew/);
  });
});

test.describe('Page Navigation - Dynamic Routes', () => {
  test('/orders/[id] 경로는 /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/orders/test-id');

    await expect(page).toHaveURL(/\/login\?redirect=%2Forders%2Ftest-id/);
  });

  test('/customers/[id] 경로는 /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/customers/test-id');

    await expect(page).toHaveURL(/\/login\?redirect=%2Fcustomers%2Ftest-id/);
  });

  test('/orders/[id]/edit 경로는 /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/orders/test-id/edit');

    await expect(page).toHaveURL(/\/login\?redirect=%2Forders%2Ftest-id%2Fedit/);
  });
});

test.describe('Browser Navigation - Back/Forward', () => {
  test('브라우저 뒤로가기/앞으로가기 동작', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login$/);

    // Try to navigate to orders (will redirect to login with redirect param)
    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login\?redirect=%2Forders/);

    // Go back
    await page.goBack();
    await expect(page).toHaveURL(/\/login$/);

    // Go forward
    await page.goForward();
    await expect(page).toHaveURL(/\/login\?redirect=%2Forders/);
  });
});

test.describe('Page Load Performance', () => {
  test('/login 페이지 로딩 시간 측정', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Basic sanity check: page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);

    // Verify page is actually rendered
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Multiple Page Visits', () => {
  test('여러 페이지 순차 방문', async ({ page }) => {
    // Visit login
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login$/);

    // Try to visit dashboard (will redirect)
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);

    // Try to visit orders (will redirect with param)
    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login\?redirect=%2Forders/);

    // Try to visit customers (will redirect with param)
    await page.goto('/customers');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fcustomers/);

    // Try to visit schedule (will redirect with param)
    await page.goto('/schedule');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fschedule/);

    // Visit offline (public route, no redirect)
    await page.goto('/offline');
    await expect(page).toHaveURL(/\/offline/);
  });
});

test.describe('Page Title Consistency', () => {
  test('모든 페이지가 ClosetBiz 타이틀을 포함', async ({ page }) => {
    const routes = ['/login', '/offline'];

    for (const route of routes) {
      await page.goto(route);
      await expect(page).toHaveTitle(/ClosetBiz/);
    }
  });
});

test.describe('Login Page Form Interaction', () => {
  test('로그인 폼 입력 및 제출 동작', async ({ page }) => {
    await page.goto('/login');

    // Fill in email
    await page.locator('input[name="email"]').fill('test@example.com');
    await expect(page.locator('input[name="email"]')).toHaveValue('test@example.com');

    // Fill in password
    await page.locator('input[name="password"]').fill('password123');
    await expect(page.locator('input[name="password"]')).toHaveValue('password123');

    // Note: We don't actually submit because there's no backend to handle it
    // Just verify that the submit button is clickable
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
  });

  test('회원가입 폼으로 전환 후 입력', async ({ page }) => {
    await page.goto('/login');

    // Toggle to signup
    await page.locator('button:has-text("계정이 없으신가요?")').click();
    await expect(page.locator('h1')).toContainText('회원가입');

    // Fill in signup form
    await page.locator('input[name="email"]').fill('newuser@example.com');
    await page.locator('input[name="password"]').fill('newpassword123');

    // Verify values
    await expect(page.locator('input[name="email"]')).toHaveValue('newuser@example.com');
    await expect(page.locator('input[name="password"]')).toHaveValue('newpassword123');

    // Verify submit button text changed
    await expect(page.locator('button[type="submit"]')).toContainText('회원가입');
  });

  test('로그인/회원가입 전환 시 에러 메시지 초기화', async ({ page }) => {
    await page.goto('/login');

    // Toggle to signup
    await page.locator('button:has-text("계정이 없으신가요?")').click();

    // Toggle back to login
    await page.locator('button:has-text("이미 계정이 있으신가요?")').click();

    // Error message should not be visible (initially)
    const errorDiv = page.locator('.bg-red-50');
    await expect(errorDiv).not.toBeVisible();
  });
});

test.describe('Responsive Navigation', () => {
  test.skip('모바일 뷰포트에서 페이지 렌더링', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/login');

    // Login form should still be visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test.skip('태블릿 뷰포트에서 페이지 렌더링', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/login');

    // Login form should still be visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});

test.describe('Auth Callback Route', () => {
  test('/auth/callback 경로는 public route', async ({ page }) => {
    await page.goto('/auth/callback');

    // Should not redirect to login
    // May show error or redirect to another page, but not /login
    const url = page.url();
    expect(url).not.toMatch(/\/login$/);
  });
});
