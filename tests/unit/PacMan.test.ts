/**
 * PacMan unit tests.
 *
 * PacMan extends Phaser.GameObjects.Sprite, so we need a minimal Phaser mock.
 * Full movement logic is implemented in Phase 2; these tests cover the
 * stable interface available from Phase 1.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TUNNEL_ROW } from '../../src/config/Constants';

// Minimal Phaser mock — only the parts PacMan uses at construction time.
vi.mock('phaser', () => {
  class Sprite {
    x = 0; y = 0;
    rotation = 0;
    texture = '';
    anims = { isPlaying: false, stop: vi.fn() };
    constructor(_scene: unknown, x: number, y: number, texture?: string) { this.x = x; this.y = y; this.texture = texture ?? ''; }
    setPosition(x: number, y: number) { this.x = x; this.y = y; return this; }
    setRotation(rotation: number) { this.rotation = rotation; return this; }
    setTexture(texture: string) { this.texture = texture; return this; }
    setOrigin() { return this; }
    play() { this.anims.isPlaying = true; return this; }
  }
  const GameObjects = { Sprite };
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
  let walkableTiles: Set<string>;

  const maze = {
    cols: 28,
    isWalkable(col: number, row: number) {
      return walkableTiles.has(`${col},${row}`);
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    pacman = new (PacMan as any)(mockScene, 14, 26);
    walkableTiles = new Set<string>();
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

  it('moves to the next tile when the path is open', () => {
    walkableTiles.add('15,26');

    pacman.setNextDirection('RIGHT');
    const crossed = pacman.move(8 / pacman.speed, maze);

    expect(crossed).toEqual({ col: 15, row: 26 });
    expect(pacman.col).toBe(15);
    expect(pacman.row).toBe(26);
    expect(pacman.direction).toBe('RIGHT');
  });

  it('stops when the next tile is blocked', () => {
    pacman.setNextDirection('RIGHT');
    const crossed = pacman.move(8 / pacman.speed, maze);

    expect(crossed).toBeNull();
    expect(pacman.col).toBe(14);
    expect(pacman.row).toBe(26);
    expect(pacman.direction).toBe('NONE');
  });

  it('applies a queued turn at the next tile center', () => {
    walkableTiles.add('15,26');
    walkableTiles.add('15,25');

    pacman.setNextDirection('RIGHT');
    pacman.move(8 / pacman.speed, maze);
    pacman.setNextDirection('UP');
    const crossed = pacman.move(8 / pacman.speed, maze);

    expect(crossed).toEqual({ col: 15, row: 25 });
    expect(pacman.col).toBe(15);
    expect(pacman.row).toBe(25);
    expect(pacman.direction).toBe('UP');
  });

  it('wraps through the tunnel row', () => {
    walkableTiles.add(`27,${TUNNEL_ROW}`);
    pacman.snapToTile(0, TUNNEL_ROW);

    pacman.setNextDirection('LEFT');
    const crossed = pacman.move(8 / pacman.speed, maze);

    expect(crossed).toEqual({ col: 27, row: TUNNEL_ROW });
    expect(pacman.col).toBe(27);
    expect(pacman.row).toBe(TUNNEL_ROW);
  });
});
