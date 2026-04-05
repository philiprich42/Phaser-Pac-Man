import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoreManager } from '../../src/systems/ScoreManager';
import { SCORE } from '../../src/config/Constants';

// Stub localStorage for test environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    clear: () => { store = {}; },
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

describe('ScoreManager', () => {
  let sm: ScoreManager;

  beforeEach(() => {
    localStorageMock.clear();
    sm = new ScoreManager();
  });

  it('starts with score 0, 3 lives, level 1', () => {
    expect(sm.score).toBe(0);
    expect(sm.lives).toBe(3);
    expect(sm.level).toBe(1);
  });

  it('adds dot score correctly', () => {
    sm.addDot();
    expect(sm.score).toBe(SCORE.DOT);
  });

  it('adds power pellet score correctly', () => {
    sm.addPowerPellet();
    expect(sm.score).toBe(SCORE.POWER_PELLET);
  });

  it('awards ghost scores with doubling combo', () => {
    sm.addPowerPellet();
    expect(sm.addGhostEaten()).toBe(200);
    expect(sm.addGhostEaten()).toBe(400);
    expect(sm.addGhostEaten()).toBe(800);
    expect(sm.addGhostEaten()).toBe(1600);
    // 5th ghost clamps to last value (1600)
    expect(sm.addGhostEaten()).toBe(1600);
  });

  it('resets ghost combo on new power pellet', () => {
    sm.addPowerPellet();
    sm.addGhostEaten(); // 200
    sm.addGhostEaten(); // 400
    sm.addPowerPellet(); // reset
    expect(sm.addGhostEaten()).toBe(200);
  });

  it('decrements lives on loseLife', () => {
    sm.loseLife();
    expect(sm.lives).toBe(2);
  });

  it('does not go below 0 lives', () => {
    sm.loseLife(); sm.loseLife(); sm.loseLife(); sm.loseLife();
    expect(sm.lives).toBe(0);
  });

  it('awards extra life at 10,000 points (once only)', () => {
    // Eat enough dots to cross the threshold
    for (let i = 0; i < 1000; i++) sm.addDot(); // 10,000 pts
    expect(sm.lives).toBe(4); // 3 + 1 extra
    for (let i = 0; i < 1000; i++) sm.addDot(); // another 10,000 pts
    expect(sm.lives).toBe(4); // no second extra life
  });

  it('advances level', () => {
    sm.advanceLevel();
    expect(sm.level).toBe(2);
  });

  it('saves high score to localStorage', () => {
    sm.addDot();
    sm.saveHighScore();
    expect(localStorageMock.getItem('pacman_high_score')).toBe(String(SCORE.DOT));
  });

  it('does not overwrite a higher existing score', () => {
    localStorageMock.setItem('pacman_high_score', '9999');
    sm = new ScoreManager(); // re-read from storage
    sm.addDot();
    sm.saveHighScore();
    expect(sm.highScore).toBe(9999);
  });

  it('resets all state', () => {
    sm.addDot(); sm.loseLife(); sm.advanceLevel();
    sm.reset();
    expect(sm.score).toBe(0);
    expect(sm.lives).toBe(3);
    expect(sm.level).toBe(1);
  });
});
