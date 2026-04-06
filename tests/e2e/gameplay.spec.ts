import { expect, test, type Page } from '@playwright/test';

async function currentScene(page: Page): Promise<string | null> {
  return page.evaluate(() => window.__PACMAN_DEBUG__?.currentScene() ?? null);
}

async function gameState(page: Page): Promise<{
  scene: string;
  score: number;
  lives: number;
  level: number;
  mode: string;
  remainingDots: number;
  pacman: { col: number; row: number; x: number; y: number; direction: string };
  ghosts: Array<{ name: string; col: number; row: number; x: number; y: number; eaten: boolean }>;
  fruitVisible: boolean;
  popupText: string | null;
  statusText: string;
  statusVisible: boolean;
}> {
  return page.evaluate(() => window.__PACMAN_DEBUG__?.gameState()) as Promise<{
    scene: string;
    score: number;
    lives: number;
    level: number;
    mode: string;
    remainingDots: number;
    pacman: { col: number; row: number; x: number; y: number; direction: string };
    ghosts: Array<{ name: string; col: number; row: number; x: number; y: number; eaten: boolean }>;
    fruitVisible: boolean;
    popupText: string | null;
    statusText: string;
    statusVisible: boolean;
  }>;
}

test.describe('Core gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 5000 });
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.__PACMAN_DEBUG__?.currentScene() === 'GameScene');
    await page.waitForTimeout(150);
  });

  test('Pac-Man moves right when right arrow is pressed', async ({ page }) => {
    const before = await gameState(page);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(250);
    const after = await gameState(page);

    expect(after.pacman.x).toBeGreaterThan(before.pacman.x);
  });

  test('Pac-Man moves left when left arrow is pressed', async ({ page }) => {
    await page.evaluate(() => window.__PACMAN_DEBUG__?.setPacManTile(4, 3));
    const before = await gameState(page);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(250);
    const after = await gameState(page);

    expect(after.pacman.x).toBeLessThan(before.pacman.x);
  });

  test('dot disappears and score increments when Pac-Man eats a dot', async ({ page }) => {
    await page.evaluate(() => window.__PACMAN_DEBUG__?.setPacManTile(2, 3));
    const before = await gameState(page);
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => {
      const state = window.__PACMAN_DEBUG__?.gameState() as { pacman: { col: number; row: number } } | null;
      return state?.pacman.col === 3 && state?.pacman.row === 3;
    });
    const after = await gameState(page);

    expect(after.remainingDots).toBe(before.remainingDots - 1);
    expect(after.score).toBe(before.score + 10);
  });

  test('ghost contact triggers game over', async ({ page }) => {
    const before = await gameState(page);
    await page.evaluate((pacman) => {
      window.__PACMAN_DEBUG__?.setGhostTile('Blinky', pacman.col, pacman.row);
    }, before.pacman);

    await page.waitForFunction(() => window.__PACMAN_DEBUG__?.currentScene() === 'GameOverScene');
    expect(await currentScene(page)).toBe('GameOverScene');
  });

  test('power pellet causes ghosts to enter frightened state', async ({ page }) => {
    await page.evaluate(() => window.__PACMAN_DEBUG__?.setPacManTile(2, 3));
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(() => {
      const state = window.__PACMAN_DEBUG__?.gameState() as { pacman: { col: number; row: number }; mode: string } | null;
      return state?.pacman.col === 1 && state?.pacman.row === 3 && state?.mode === 'frightened';
    });

    const state = await gameState(page);
    expect(state.mode).toBe('frightened');
  });

  test('eating a frightened ghost shows the combo score pop-up', async ({ page }) => {
    await page.evaluate(() => window.__PACMAN_DEBUG__?.setPacManTile(2, 3));
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(() => {
      const state = window.__PACMAN_DEBUG__?.gameState() as { pacman: { col: number; row: number }; mode: string } | null;
      return state?.pacman.col === 1 && state?.pacman.row === 3 && state?.mode === 'frightened';
    });

    const frightenedState = await gameState(page);
    await page.evaluate((pacman) => {
      window.__PACMAN_DEBUG__?.setGhostTile('Blinky', pacman.col, pacman.row);
    }, frightenedState.pacman);

    await page.waitForFunction(() => {
      const state = window.__PACMAN_DEBUG__?.gameState() as { popupText?: string | null } | null;
      return state?.popupText === '200';
    });

    const after = await gameState(page);
    expect(after.popupText).toBe('200');
    expect(after.ghosts.find((ghost: { name: string; eaten: boolean }) => ghost.name === 'Blinky')?.eaten).toBe(true);
  });
});
