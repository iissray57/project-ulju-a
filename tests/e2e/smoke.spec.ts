import { test, expect } from '@playwright/test';

test('홈페이지 로딩', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/울주앵글/);
});
