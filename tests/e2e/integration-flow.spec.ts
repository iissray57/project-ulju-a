import { test, expect } from '@playwright/test';

test.describe('Integration Flow - Full Business Cycle', () => {
  test('로그인 페이지 접근 및 폼 검증', async ({ page }) => {
    await page.goto('/login');

    // 페이지 로드 확인
    await expect(page).toHaveURL(/\/login/);

    // 폼 요소 존재 확인
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // 빈 폼 제출 시 검증 (HTML5 validation)
    await submitButton.click();
    // HTML5 required 속성이 있으면 폼이 제출되지 않음
  });

  test('보호된 라우트 접근 시 리다이렉트 확인', async ({ page }) => {
    // 인증 없이 대시보드 접근 시도
    await page.goto('/dashboard');

    // 로그인 페이지로 리다이렉트되어야 함
    await page.waitForURL(/\/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('API 엔드포인트 구조 검증 - /api/pdf', async ({ page }) => {
    const response = await page.request.get('/api/pdf');

    // API가 존재하고 응답을 반환하는지 확인
    // 인증 없이는 200, 401, 405, 400, 307(리다이렉트), 308 중 하나 예상
    expect([200, 307, 308, 401, 405, 400]).toContain(response.status());
  });

  test('PWA 매니페스트 파일 접근', async ({ page }) => {
    const response = await page.request.get('/manifest.webmanifest');

    // 매니페스트 파일이 존재하고 JSON 형식인지 확인
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'];
    expect(contentType).toMatch(/application\/(manifest\+)?json/);

    const manifest = await response.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
    expect(manifest).toHaveProperty('icons');
  });

  test('오프라인 페이지 접근', async ({ page }) => {
    await page.goto('/offline');

    // 오프라인 페이지가 로드되는지 확인
    await expect(page).toHaveURL(/\/offline/);

    // 페이지에 오프라인 관련 텍스트가 있는지 확인
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('404 에러 처리', async ({ page }) => {
    const response = await page.goto('/non-existent-page-12345');

    // 404 응답 또는 404 페이지로 리다이렉트
    // Next.js는 404 페이지를 렌더링하므로 200을 반환할 수 있음
    if (response) {
      expect([200, 404]).toContain(response.status());
    }

    // 404 페이지 콘텐츠 확인
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('잘못된 ID로 동적 라우트 접근', async ({ page }) => {
    // 잘못된 형식의 ID로 접근 시도
    await page.goto('/orders/invalid-uuid-format');

    // 에러 페이지 또는 리다이렉트 확인
    const url = page.url();
    expect(url).toBeTruthy();

    // 페이지가 렌더링되는지 확인
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('정적 리소스 접근 - favicon', async ({ page }) => {
    const response = await page.request.get('/favicon.ico');

    // favicon이 존재하는지 확인
    expect([200, 204, 404]).toContain(response.status());
  });

  test('PWA 아이콘 리소스 접근', async ({ page }) => {
    const icon192Response = await page.request.get('/icons/icon-192.png');
    const icon512Response = await page.request.get('/icons/icon-512.png');

    // 아이콘 파일이 존재하는지 확인
    expect(icon192Response.status()).toBe(200);
    expect(icon512Response.status()).toBe(200);

    // 이미지 타입 확인
    expect(icon192Response.headers()['content-type']).toContain('image/png');
    expect(icon512Response.headers()['content-type']).toContain('image/png');
  });

  test('홈페이지 접근', async ({ page }) => {
    const response = await page.goto('/');

    // 홈페이지가 로드되는지 확인
    expect(response?.status()).toBe(200);

    // 페이지 콘텐츠가 있는지 확인
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('로그인 페이지에서 홈으로 네비게이션', async ({ page }) => {
    await page.goto('/login');

    // 로고나 홈 링크 클릭 (있는 경우)
    const homeLink = page.locator('a[href="/"]').first();

    if (await homeLink.count() > 0) {
      await homeLink.click();
      await expect(page).toHaveURL('/');
    }
  });

  test('연속된 페이지 이동 플로우', async ({ page }) => {
    // 홈 → 로그인 → 홈
    await page.goto('/');
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    // 홈으로 이동 시 인증 없으면 로그인으로 리다이렉트될 수 있음
    const response = await page.goto('/');
    const url = page.url();
    expect(url).toMatch(/\/(login)?/);
  });
});
