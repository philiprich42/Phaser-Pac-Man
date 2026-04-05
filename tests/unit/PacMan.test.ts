/**
 * PacMan unit tests.
 *
 * PacMan extends Phaser.GameObjects.Arc, so we need a minimal Phaser mock.
 * Full movement logic is implemented in Phase 2; these tests cover the
 * stable interface available from Phase 1.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Minimal Phaser mock — only the parts PacMan uses at construction time.
vi.mock('phaser', () => {
  class Arc {
    x = 0; y = 0;
    constructor(_scene: unknown, x: number, y: number) { this.x = x; this.y = y; }
    setPosition(x: number, y: number) { this.x = x; this.y = y; }
  }
  const GameObjects = { Arc };
  return { default: { GameObjects } };
});

// Mock scene
const mockScene = {
  add: { existing: vi.fn() },
};

// Import AFTER mock is in place
const { PacMan } = await import('../../src/entities/PacMan');

describe('PacMan', () => {
  let pacman: InstanceType<typeof PacMan>;

  beforeEach(() => {
    vi.clearAllMocks();
    pacman = new (PacMan as any)(mockScene, 14, 26);
  });

  it('initialises at the given tile', () => {
    expect(pacman.col).toBe(14);
    expect(pacman.row).toBe(26);
  });

  it('direction starts as NONE', () => {
    expect(pacman.direction).toBe('NONE');
  });

  it('snapToTile updates col/row', () => {
    pacman.snapToTile(5, 10);
    expect(pacman.col).toBe(5);
    expect(pacman.row).toBe(10);
  });

  it('snapToTile resets direction', () => {
    pacman.setNextDirection('LEFT');
    pacman.snapToTile(5, 10);
    expect(pacman.direction).toBe('NONE');
  });

  it('speed is a positive number', () => {
    expect(pacman.speed).toBeGreaterThan(0);
  });

  it('setSpeedMultiplier affects speed', () => {
    const base = pacman.speed;
    pacman.setSpeedMultiplier(0.5);
    expect(pacman.speed).toBeCloseTo(base * 0.5);
  });
});
