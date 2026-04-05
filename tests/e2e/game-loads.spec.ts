import { test, expect } from '@playwright/test';

test.describe('Game loads', () => {
  test('page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForTimeout(2000); // allow Phaser to initialise

    expect(errors).toHaveLength(0);
  });

  test('canvas element is rendered', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 5000 });
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('menu screen shows PAC-MAN title', async ({ page }) => {
    await page.goto('/');
    // Phaser renders to canvas — check page title or a DOM element as a proxy
    await expect(page).toHaveTitle(/pac.man/i);
  });
});
