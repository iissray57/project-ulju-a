import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

// Helper function to check for console errors
function setupConsoleErrorListener(page: Page, pageName: string, errors: any[]) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push({
        page: pageName,
        message: msg.text(),
        location: msg.location()
      });
    }
  });

  page.on('pageerror', (error) => {
    errors.push({
      page: pageName,
      message: error.message,
      stack: error.stack
    });
  });
}

// Helper function to check for network errors
function setupNetworkErrorListener(page: Page, pageName: string, networkErrors: any[]) {
  page.on('response', (response) => {
    if (response.status() >= 400) {
      networkErrors.push({
        page: pageName,
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });
}

test.describe('UljuAngle Full UI Test', () => {
  let consoleErrors: any[] = [];
  let networkErrors: any[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    networkErrors = [];
  });

  test.afterAll(async () => {
    // Print summary
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Network Errors: ${networkErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      consoleErrors.forEach((err, idx) => {
        console.log(`\n${idx + 1}. Page: ${err.page}`);
        console.log(`   Message: ${err.message}`);
        if (err.location) {
          console.log(`   Location: ${err.location.url}:${err.location.lineNumber}`);
        }
      });
    }

    if (networkErrors.length > 0) {
      console.log('\n=== NETWORK ERRORS ===');
      networkErrors.forEach((err, idx) => {
        console.log(`\n${idx + 1}. Page: ${err.page}`);
        console.log(`   URL: ${err.url}`);
        console.log(`   Status: ${err.status} ${err.statusText}`);
      });
    }
  });

  test('Login Page: /login', async ({ page }) => {
    setupConsoleErrorListener(page, '/login', consoleErrors);
    setupNetworkErrorListener(page, '/login', networkErrors);

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Check if page loaded
    await expect(page).toHaveTitle(/울주앵글|UljuAngle|로그인/i);

    // Check for login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput.first()).toBeVisible({ timeout: 5000 }).catch(() => {
      consoleErrors.push({ page: '/login', message: 'Email input not found' });
    });

    await expect(passwordInput.first()).toBeVisible({ timeout: 5000 }).catch(() => {
      consoleErrors.push({ page: '/login', message: 'Password input not found' });
    });

    await expect(submitButton.first()).toBeVisible({ timeout: 5000 }).catch(() => {
      consoleErrors.push({ page: '/login', message: 'Submit button not found' });
    });
  });

  test('Main Dashboard: /', async ({ page }) => {
    setupConsoleErrorListener(page, '/', consoleErrors);
    setupNetworkErrorListener(page, '/', networkErrors);

    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');

    // Check if redirected to login or dashboard loaded
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('Redirected to login (expected for unauthenticated user)');
    } else {
      await expect(page).toHaveTitle(/Dashboard|대시보드/i);
    }
  });

  test('Closet Editor: /closet/editor', async ({ page }) => {
    setupConsoleErrorListener(page, '/closet/editor', consoleErrors);
    setupNetworkErrorListener(page, '/closet/editor', networkErrors);

    await page.goto(`${BASE_URL}/closet/editor`);
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      // Check for canvas or editor elements
      const canvas = page.locator('canvas');
      await expect(canvas.first()).toBeVisible({ timeout: 10000 }).catch(() => {
        consoleErrors.push({ page: '/closet/editor', message: 'Canvas element not found' });
      });
    }
  });

  test('Closet Presets: /closet/presets', async ({ page }) => {
    setupConsoleErrorListener(page, '/closet/presets', consoleErrors);
    setupNetworkErrorListener(page, '/closet/presets', networkErrors);

    await page.goto(`${BASE_URL}/closet/presets`);
    await page.waitForLoadState('networkidle');
  });

  test('Customers List: /customers', async ({ page }) => {
    setupConsoleErrorListener(page, '/customers', consoleErrors);
    setupNetworkErrorListener(page, '/customers', networkErrors);

    await page.goto(`${BASE_URL}/customers`);
    await page.waitForLoadState('networkidle');
  });

  test('New Customer: /customers/new', async ({ page }) => {
    setupConsoleErrorListener(page, '/customers/new', consoleErrors);
    setupNetworkErrorListener(page, '/customers/new', networkErrors);

    await page.goto(`${BASE_URL}/customers/new`);
    await page.waitForLoadState('networkidle');
  });

  test('Customer Detail: /customers/1', async ({ page }) => {
    setupConsoleErrorListener(page, '/customers/1', consoleErrors);
    setupNetworkErrorListener(page, '/customers/1', networkErrors);

    await page.goto(`${BASE_URL}/customers/1`);
    await page.waitForLoadState('networkidle');
  });

  test('Edit Customer: /customers/1/edit', async ({ page }) => {
    setupConsoleErrorListener(page, '/customers/1/edit', consoleErrors);
    setupNetworkErrorListener(page, '/customers/1/edit', networkErrors);

    await page.goto(`${BASE_URL}/customers/1/edit`);
    await page.waitForLoadState('networkidle');
  });

  test('Finance: /finance', async ({ page }) => {
    setupConsoleErrorListener(page, '/finance', consoleErrors);
    setupNetworkErrorListener(page, '/finance', networkErrors);

    await page.goto(`${BASE_URL}/finance`);
    await page.waitForLoadState('networkidle');
  });

  test('Inventory: /inventory', async ({ page }) => {
    setupConsoleErrorListener(page, '/inventory', consoleErrors);
    setupNetworkErrorListener(page, '/inventory', networkErrors);

    await page.goto(`${BASE_URL}/inventory`);
    await page.waitForLoadState('networkidle');
  });

  test('Inventory History: /inventory/history', async ({ page }) => {
    setupConsoleErrorListener(page, '/inventory/history', consoleErrors);
    setupNetworkErrorListener(page, '/inventory/history', networkErrors);

    await page.goto(`${BASE_URL}/inventory/history`);
    await page.waitForLoadState('networkidle');
  });

  test('Orders List: /orders', async ({ page }) => {
    setupConsoleErrorListener(page, '/orders', consoleErrors);
    setupNetworkErrorListener(page, '/orders', networkErrors);

    await page.goto(`${BASE_URL}/orders`);
    await page.waitForLoadState('networkidle');
  });

  test('New Order: /orders/new', async ({ page }) => {
    setupConsoleErrorListener(page, '/orders/new', consoleErrors);
    setupNetworkErrorListener(page, '/orders/new', networkErrors);

    await page.goto(`${BASE_URL}/orders/new`);
    await page.waitForLoadState('networkidle');
  });

  test('Order Detail: /orders/1', async ({ page }) => {
    setupConsoleErrorListener(page, '/orders/1', consoleErrors);
    setupNetworkErrorListener(page, '/orders/1', networkErrors);

    await page.goto(`${BASE_URL}/orders/1`);
    await page.waitForLoadState('networkidle');
  });

  test('Edit Order: /orders/1/edit', async ({ page }) => {
    setupConsoleErrorListener(page, '/orders/1/edit', consoleErrors);
    setupNetworkErrorListener(page, '/orders/1/edit', networkErrors);

    await page.goto(`${BASE_URL}/orders/1/edit`);
    await page.waitForLoadState('networkidle');
  });

  test('Purchases List: /purchases', async ({ page }) => {
    setupConsoleErrorListener(page, '/purchases', consoleErrors);
    setupNetworkErrorListener(page, '/purchases', networkErrors);

    await page.goto(`${BASE_URL}/purchases`);
    await page.waitForLoadState('networkidle');
  });

  test('New Purchase: /purchases/new', async ({ page }) => {
    setupConsoleErrorListener(page, '/purchases/new', consoleErrors);
    setupNetworkErrorListener(page, '/purchases/new', networkErrors);

    await page.goto(`${BASE_URL}/purchases/new`);
    await page.waitForLoadState('networkidle');
  });

  test('Purchase Detail: /purchases/1', async ({ page }) => {
    setupConsoleErrorListener(page, '/purchases/1', consoleErrors);
    setupNetworkErrorListener(page, '/purchases/1', networkErrors);

    await page.goto(`${BASE_URL}/purchases/1`);
    await page.waitForLoadState('networkidle');
  });

  test('Edit Purchase: /purchases/1/edit', async ({ page }) => {
    setupConsoleErrorListener(page, '/purchases/1/edit', consoleErrors);
    setupNetworkErrorListener(page, '/purchases/1/edit', networkErrors);

    await page.goto(`${BASE_URL}/purchases/1/edit`);
    await page.waitForLoadState('networkidle');
  });

  test('Receive Purchase: /purchases/1/receive', async ({ page }) => {
    setupConsoleErrorListener(page, '/purchases/1/receive', consoleErrors);
    setupNetworkErrorListener(page, '/purchases/1/receive', networkErrors);

    await page.goto(`${BASE_URL}/purchases/1/receive`);
    await page.waitForLoadState('networkidle');
  });

  test('Reports: /reports', async ({ page }) => {
    setupConsoleErrorListener(page, '/reports', consoleErrors);
    setupNetworkErrorListener(page, '/reports', networkErrors);

    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
  });

  test('Schedule: /schedule', async ({ page }) => {
    setupConsoleErrorListener(page, '/schedule', consoleErrors);
    setupNetworkErrorListener(page, '/schedule', networkErrors);

    await page.goto(`${BASE_URL}/schedule`);
    await page.waitForLoadState('networkidle');
  });
});
