import Phaser from 'phaser';
import { TILE_SIZE, BASE_SPEED, SCATTER_TARGETS } from '../config/Constants';
import { ANIMS, TEXTURES } from '../config/VisualKeys';
import { GhostMode } from '../systems/GhostAI';
import { MazeManager } from '../systems/MazeManager';
import { getNeighbours, nextTileTowards, Tile } from '../utils/PathFinder';
import { PacMan } from './PacMan';

export abstract class Ghost extends Phaser.GameObjects.Sprite {
  protected _col: number;
  protected _row: number;
  protected _prevCol: number | null = null;
  protected _prevRow: number | null = null;
  protected _speedMultiplier = 0.75;
  private _targetTile: Tile | null = null;
  private readonly _normalAnim: string;

  constructor(
    scene: Phaser.Scene,
    col: number,
    row: number,
    readonly name: string,
    textureKey: string,
    animKey: string
  ) {
    super(
      scene,
      col * TILE_SIZE + TILE_SIZE / 2,
      row * TILE_SIZE + TILE_SIZE / 2,
      textureKey
    );
    this._col = col;
    this._row = row;
    this._normalAnim = animKey;
    scene.add.existing(this);
    this.play(animKey);
    this.setOrigin(0.5);
  }

  get col(): number { return this._col; }
  get row(): number { return this._row; }

  setSpeedMultiplier(m: number): void { this._speedMultiplier = m; }

  get speed(): number { return BASE_SPEED * this._speedMultiplier; }

  /** Abstract: returns the chase target tile for this ghost. Implemented by subclasses. */
  abstract chaseTarget(pacman: PacMan, blinky?: Ghost): Tile;

  scatterTarget(): Tile {
    const [col, row] = SCATTER_TARGETS[this.name];
    return { col, row };
  }

  /**
   * Determine the next tile to move to based on current mode.
   */
  getNextTile(mode: GhostMode, pacman: PacMan, maze: MazeManager, blinky?: Ghost): Tile | null {
    const opts = maze.toPathFinderOptions();
    const current: Tile = { col: this._col, row: this._row };
    const prev = this._prevCol !== null
      ? { col: this._prevCol, row: this._prevRow! }
      : null;

    let target: Tile;
    switch (mode) {
      case 'scatter':
        target = this.scatterTarget();
        break;
      case 'chase':
        target = this.chaseTarget(pacman, blinky);
        break;
      case 'frightened': {
        const neighbours = getNeighbours(current, opts, prev ?? undefined);
        if (neighbours.length === 0) {
          return null;
        }
        const randomIndex = Math.floor(Math.random() * neighbours.length);
        return neighbours[randomIndex];
      }
      case 'eaten':
        target = { col: 14, row: 17 };
        break;
      default:
        return null;
    }

    return nextTileTowards(current, prev, target, opts);
  }

  move(
    delta: number,
    mode: GhostMode,
    pacman: PacMan,
    maze: MazeManager,
    blinky?: Ghost
  ): { col: number; row: number } | null {
    let remaining = this.speed * delta;
    let crossedTile: { col: number; row: number } | null = null;

    while (remaining > 0) {
      if (this._isCentered()) {
        this._snapToCurrentTile();
        this._targetTile = this.getNextTile(mode, pacman, maze, blinky);
        if (!this._targetTile) {
          break;
        }
      }

      if (!this._targetTile) {
        break;
      }

      const targetCenter = maze.tileCenter(this._targetTile.col, this._targetTile.row);
      const distanceToTarget = Math.hypot(targetCenter.x - this.x, targetCenter.y - this.y);
      const step = Math.min(remaining, distanceToTarget);
      const angle = Math.atan2(targetCenter.y - this.y, targetCenter.x - this.x);

      this.setPosition(
        this.x + Math.cos(angle) * step,
        this.y + Math.sin(angle) * step
      );
      remaining -= step;

      if (step === distanceToTarget) {
        this._prevCol = this._col;
        this._prevRow = this._row;
        this._col = this._targetTile.col;
        this._row = this._targetTile.row;
        this.setPosition(targetCenter.x, targetCenter.y);
        this._targetTile = null;
        crossedTile = { col: this._col, row: this._row };
      }
    }

    return crossedTile;
  }

  snapToTile(col: number, row: number): void {
    this._col = col;
    this._row = row;
    this._prevCol = null;
    this._prevRow = null;
    this._targetTile = null;
    this.setPosition(col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE / 2);
  }

  setAppearance(mode: GhostMode, flashing: boolean, eaten: boolean): void {
    if (eaten) {
      this.anims.stop();
      this.setTexture(TEXTURES.GHOST_EYES);
      return;
    }

    if (mode === 'frightened') {
      this.play(flashing ? ANIMS.GHOST_FLASH : ANIMS.GHOST_FRIGHTENED, true);
      return;
    }

    this.play(this._normalAnim, true);
  }

  private _isCentered(): boolean {
    const centerX = this._col * TILE_SIZE + TILE_SIZE / 2;
    const centerY = this._row * TILE_SIZE + TILE_SIZE / 2;
    return Math.hypot(centerX - this.x, centerY - this.y) < 0.01;
  }

  private _snapToCurrentTile(): void {
    this.setPosition(
      this._col * TILE_SIZE + TILE_SIZE / 2,
      this._row * TILE_SIZE + TILE_SIZE / 2
    );
  }
}
