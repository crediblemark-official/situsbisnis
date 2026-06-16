import { test, expect } from '@playwright/test';

test.describe('Public Site', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SitusBisnis|Situs Bisnis/i);
  });

  test('should display navigation', async ({ page, isMobile }) => {
    await page.goto('/');
    if (!isMobile) {
      await expect(page.locator('nav')).toBeVisible();
    }
  });
});

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should show register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });

  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Dashboard', () => {
  test.skip('should require authentication', async ({ }) => {
    // This test requires auth setup - skipped for now
  });
});