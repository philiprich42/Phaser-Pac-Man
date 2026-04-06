import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MazeManager, TileType } from '../../src/systems/MazeManager';

vi.mock('phaser', () => {
  class Sprite {
    x = 0;
    y = 0;
    rotation = 0;
    texture = '';
    anims = { isPlaying: false, stop: vi.fn() };

    constructor(_scene: unknown, x: number, y: number, texture?: string) {
      this.x = x;
      this.y = y;
      this.texture = texture ?? '';
    }

    setPosition(x: number, y: number) {
      this.x = x;
      this.y = y;
      return this;
    }

    setTexture(texture: string) {
      this.texture = texture;
      return this;
    }

    setRotation(rotation: number) {
      this.rotation = rotation;
      return this;
    }

    setOrigin() { return this; }
    play() { this.anims.isPlaying = true; return this; }
  }

  const GameObjects = { Sprite };
  return { default: { GameObjects } };
});

const mockScene = {
  add: { existing: vi.fn() },
};

const { PacMan } = await import('../../src/entities/PacMan');
const { Blinky } = await import('../../src/entities/Blinky');
const { Pinky } = await import('../../src/entities/Pinky');
const { Inky } = await import('../../src/entities/Inky');
const { Clyde } = await import('../../src/entities/Clyde');

function createOpenMaze(cols = 28, rows = 36): MazeManager {
  const maze = new MazeManager();
  maze.loadTiles(Array(cols * rows).fill(TileType.Empty), cols, rows);
  return maze;
}

describe('Ghost personalities', () => {
  let pacman: InstanceType<typeof PacMan>;
  let blinky: InstanceType<typeof Blinky>;
  let pinky: InstanceType<typeof Pinky>;
  let inky: InstanceType<typeof Inky>;
  let clyde: InstanceType<typeof Clyde>;

  beforeEach(() => {
    vi.clearAllMocks();
    pacman = new (PacMan as any)(mockScene, 14, 26);
    blinky = new (Blinky as any)(mockScene, 10, 10);
    pinky = new (Pinky as any)(mockScene, 12, 17);
    inky = new (Inky as any)(mockScene, 14, 15);
    clyde = new (Clyde as any)(mockScene, 16, 17);
  });

  it('Blinky targets Pac-Man directly', () => {
    expect(blinky.chaseTarget(pacman)).toEqual({ col: 14, row: 26 });
  });

  it('Pinky targets four tiles ahead of Pac-Man', () => {
    pacman.setNextDirection('RIGHT');
    pacman.move(8 / pacman.speed, {
      cols: 28,
      isWalkable: () => true,
      tileCenter: (col: number, row: number) => ({ x: col * 8 + 4, y: row * 8 + 4 }),
    } as any);

    expect(pinky.chaseTarget(pacman)).toEqual({ col: 19, row: 26 });
  });

  it('Inky reflects Blinky through the pivot two tiles ahead of Pac-Man', () => {
    pacman.setNextDirection('DOWN');
    pacman.move(8 / pacman.speed, {
      cols: 28,
      isWalkable: () => true,
      tileCenter: (col: number, row: number) => ({ x: col * 8 + 4, y: row * 8 + 4 }),
    } as any);

    expect(inky.chaseTarget(pacman, blinky)).toEqual({ col: 18, row: 48 });
  });

  it('Clyde retreats to scatter corner when Pac-Man is close', () => {
    clyde.snapToTile(14, 24);
    expect(clyde.chaseTarget(pacman)).toEqual({ col: 0, row: 35 });
  });
});

describe('Ghost movement', () => {
  let pacman: InstanceType<typeof PacMan>;
  let blinky: InstanceType<typeof Blinky>;
  let maze: MazeManager;

  beforeEach(() => {
    vi.clearAllMocks();
    pacman = new (PacMan as any)(mockScene, 14, 26);
    blinky = new (Blinky as any)(mockScene, 14, 17);
    maze = createOpenMaze();
  });

  it('moves one tile toward its chase target', () => {
    const crossed = blinky.move(8 / blinky.speed, 'chase', pacman, maze, blinky);
    expect(crossed).toEqual({ col: 14, row: 18 });
  });

  it('returns a random valid neighbour in frightened mode', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const crossed = blinky.move(8 / blinky.speed, 'frightened', pacman, maze, blinky);
    expect(crossed).toEqual({ col: 14, row: 18 });
    randomSpy.mockRestore();
  });

  it('heads back to the house in eaten mode', () => {
    blinky.snapToTile(10, 17);
    const crossed = blinky.move(8 / blinky.speed, 'eaten', pacman, maze, blinky);
    expect(crossed).toEqual({ col: 11, row: 17 });
  });
});
