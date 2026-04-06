import { expect, test } from '@playwright/test';

test.describe('Score persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('pacman_high_score'));
  });

  test('high score is written to localStorage after game over', async ({ page }) => {
    await page.waitForSelector('canvas', { timeout: 5000 });
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.__PACMAN_DEBUG__?.currentScene() === 'GameScene');

    await page.evaluate(() => {
      window.__PACMAN_DEBUG__?.setScoreState(1234, 1, 3);
      const state = window.__PACMAN_DEBUG__?.gameState() as { pacman: { col: number; row: number } };
      window.__PACMAN_DEBUG__?.setGhostTile('Blinky', state.pacman.col, state.pacman.row);
    });

    await page.waitForFunction(() => window.__PACMAN_DEBUG__?.currentScene() === 'GameOverScene');
    const stored = await page.evaluate(() => localStorage.getItem('pacman_high_score'));
    const gameOver = await page.evaluate(() => window.__PACMAN_DEBUG__?.gameOverState()) as {
      score: number;
      level: number;
      highScore: string | null;
    };

    expect(stored).toBe('1234');
    expect(gameOver.score).toBe(1234);
    expect(gameOver.level).toBe(3);
  });

  test('high score is displayed on the menu screen', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('pacman_high_score', '4321'));
    await page.reload();
    await page.waitForFunction(() => window.__PACMAN_DEBUG__?.currentScene() === 'MenuScene');

    const menu = await page.evaluate(() => window.__PACMAN_DEBUG__?.menuState()) as {
      highScore: string;
    };
    expect(menu.highScore).toBe('4321');
  });

  test('localStorage is accessible in the game context', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('pacman_high_score', '1234'));
    const val = await page.evaluate(() => localStorage.getItem('pacman_high_score'));
    expect(val).toBe('1234');
  });
});
