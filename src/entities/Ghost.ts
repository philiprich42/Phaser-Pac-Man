import Phaser from 'phaser';
import { TILE_SIZE, BASE_SPEED, SCATTER_TARGETS } from '../config/Constants';
import { GhostMode } from '../systems/GhostAI';
import { MazeManager } from '../systems/MazeManager';
import { nextTileTowards, Tile } from '../utils/PathFinder';
import { PacMan } from './PacMan';

export abstract class Ghost extends Phaser.GameObjects.Arc {
  protected _col: number;
  protected _row: number;
  protected _prevCol: number | null = null;
  protected _prevRow: number | null = null;
  protected _speedMultiplier = 0.75;

  constructor(
    scene: Phaser.Scene,
    col: number,
    row: number,
    readonly name: string,
    color: number
  ) {
    super(
      scene,
      col * TILE_SIZE + TILE_SIZE / 2,
      row * TILE_SIZE + TILE_SIZE / 2,
      TILE_SIZE / 2 - 1,
      0,
      360,
      false,
      color
    );
    this._col = col;
    this._row = row;
    scene.add.existing(this);
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
   * Full movement logic implemented in Phase 3.
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
        // Random valid neighbour (implemented in Phase 3)
        const neighbours = nextTileTowards(current, prev, { col: 0, row: 0 }, opts);
        return neighbours;
      }
      case 'eaten':
        // Return to ghost house (implemented in Phase 3)
        target = { col: 14, row: 17 };
        break;
      default:
        return null;
    }

    return nextTileTowards(current, prev, target, opts);
  }

  snapToTile(col: number, row: number): void {
    this._col = col;
    this._row = row;
    this._prevCol = null;
    this._prevRow = null;
    this.setPosition(col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE / 2);
  }
}
