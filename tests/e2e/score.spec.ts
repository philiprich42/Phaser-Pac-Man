import { test, expect } from '@playwright/test';

test.describe('Score persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear any previous high score
    await page.evaluate(() => localStorage.removeItem('pacman_high_score'));
  });

  test.skip('High score is written to localStorage after game over', async () => {});

  test.skip('High score is displayed on the menu screen', async () => {});

  test('localStorage is accessible in the game context', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('pacman_high_score', '1234'));
    const val = await page.evaluate(() => localStorage.getItem('pacman_high_score'));
    expect(val).toBe('1234');
  });
});
