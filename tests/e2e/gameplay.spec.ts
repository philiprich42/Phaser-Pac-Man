import { test } from '@playwright/test';

/**
 * Core gameplay E2E tests.
 * These tests drive the browser and interact with the game via keyboard events.
 * Full implementation depends on Phase 2+ work — marked as skipped until then.
 */

test.describe('Core gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 5000 });
    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
  });

  test.skip('Pac-Man moves right when right arrow is pressed', async () => {});
  test.skip('Pac-Man moves left when left arrow is pressed', async () => {});
  test.skip('Dot count decreases when Pac-Man eats a dot', async () => {});
  test.skip('Score increases when a dot is eaten', async () => {});
  test.skip('Ghost contact triggers game over', async () => {});
  test.skip('Power pellet causes ghosts to enter frightened state', async () => {});
  test.skip('Eating a frightened ghost shows score pop-up', async () => {});
});
