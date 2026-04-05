import { test, expect } from '@playwright/test';

/**
 * Core gameplay E2E tests.
 * These tests drive the browser and interact with the game via keyboard events.
 * Full implementation depends on Phase 2+ work — marked with todo() until then.
 */

test.describe('Core gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 5000 });
    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
  });

  test.todo('Pac-Man moves right when right arrow is pressed');
  test.todo('Pac-Man moves left when left arrow is pressed');
  test.todo('Dot count decreases when Pac-Man eats a dot');
  test.todo('Score increases when a dot is eaten');
  test.todo('Ghost contact triggers game over');
  test.todo('Power pellet causes ghosts to enter frightened state');
  test.todo('Eating a frightened ghost shows score pop-up');
});
