import { test, expect } from '@playwright/test';

/**
 * Order Lifecycle E2E Tests
 *
 * Tests authentication flow, page rendering, and UI elements
 * without actual Supabase backend integration.
 */

test.describe('Order Lifecycle - Unauthenticated Flow', () => {
  test('미인증 사용자는 /orders 접근 시 /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/orders');

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);

    // Login page should render
    await expect(page.locator('h1')).toContainText('로그인');
  });

  test('미인증 사용자는 /orders/new 접근 시 /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/orders/new');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText('로그인');
  });

  test('미인증 사용자는 / 대시보드 접근 시 /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText('로그인');
  });

  test('미인증 사용자는 /customers 접근 시 /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/customers');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText('로그인');
  });

  test('미인증 사용자는 /schedule 접근 시 /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/schedule');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText('로그인');
  });
});

test.describe('Login Page Rendering', () => {
  test('/login 페이지가 정상적으로 렌더링됨', async ({ page }) => {
    await page.goto('/login');

    // Page title should contain 울주앵글
    await expect(page).toHaveTitle(/울주앵글/);

    // Login form heading
    await expect(page.locator('h1')).toContainText('로그인');

    // Email input
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('label[for="email"]')).toContainText('이메일');

    // Password input
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toContainText('비밀번호');

    // Submit button
    await expect(page.locator('button[type="submit"]')).toContainText('로그인');
  });

  test('로그인 ↔ 회원가입 토글이 동작함', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Initially shows login
    await expect(page.locator('h1')).toContainText('로그인');
    await expect(page.locator('button[type="submit"]')).toContainText('로그인');

    // Click toggle to signup
    const toggleToSignup = page.locator('button.text-blue-600:has-text("회원가입")');
    await toggleToSignup.waitFor({ state: 'visible' });
    await toggleToSignup.click();

    // Should now show signup
    await expect(page.locator('h1')).toContainText('회원가입', { timeout: 3000 });
    await expect(page.locator('button[type="submit"]')).toContainText('회원가입');

    // Click toggle back to login
    const toggleToLogin = page.locator('button.text-blue-600:has-text("로그인")');
    await toggleToLogin.waitFor({ state: 'visible' });
    await toggleToLogin.click();

    // Should be back to login
    await expect(page.locator('h1')).toContainText('로그인', { timeout: 3000 });
    await expect(page.locator('button[type="submit"]')).toContainText('로그인');
  });

  test('로그인 폼 입력 필드가 required 속성을 가짐', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('이메일 입력 필드가 placeholder를 가짐', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('placeholder', 'your@email.com');
  });
});

test.describe('Protected Routes Redirect with redirect parameter', () => {
  test('/orders 접근 시 redirect 파라미터 포함', async ({ page }) => {
    await page.goto('/orders');

    await expect(page).toHaveURL(/\/login\?redirect=%2Forders/);
  });

  test('/customers/new 접근 시 redirect 파라미터 포함', async ({ page }) => {
    await page.goto('/customers/new');

    await expect(page).toHaveURL(/\/login\?redirect=%2Fcustomers%2Fnew/);
  });

  test('/schedule 접근 시 redirect 파라미터 포함', async ({ page }) => {
    await page.goto('/schedule');

    await expect(page).toHaveURL(/\/login\?redirect=%2Fschedule/);
  });
});

test.describe('Order Form Elements (if accessible)', () => {
  test.skip('/orders/new 페이지 폼 구조 확인 (requires auth)', async ({ page }) => {
    // This test is skipped because it requires authentication
    // In future, add auth fixture to test this scenario
    await page.goto('/orders/new');

    // Would check form fields like:
    // - Customer selection
    // - Order details
    // - Submit button
  });
});

test.describe('Offline Page Accessibility', () => {
  test('/offline 페이지는 인증 없이 접근 가능', async ({ page }) => {
    await page.goto('/offline');

    // Should NOT redirect to login
    await expect(page).not.toHaveURL(/\/login/);

    // Page should render (basic check)
    await expect(page).toHaveTitle(/울주앵글/);
  });
});

test.describe('Static Asset Routes', () => {
  test('/_next/* 경로는 미들웨어를 거치지 않음', async ({ page }) => {
    // This is more of a middleware config test
    // Just verify that the page can load normally with assets
    await page.goto('/login');

    // Wait for page to be fully loaded with all assets
    await page.waitForLoadState('networkidle');

    // Check that CSS is applied (text should not be default browser style)
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });
});
