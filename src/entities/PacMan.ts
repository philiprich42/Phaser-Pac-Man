import Phaser from 'phaser';
import { TILE_SIZE, BASE_SPEED } from '../config/Constants';
import { Direction } from '../systems/InputManager';
import { MazeManager } from '../systems/MazeManager';

export class PacMan extends Phaser.GameObjects.Arc {
  private _col = 14;
  private _row = 26;
  private _direction: Direction = 'NONE';
  private _nextDirection: Direction = 'NONE';
  private _speedMultiplier = 1.0;

  constructor(scene: Phaser.Scene, col: number, row: number) {
    super(
      scene,
      col * TILE_SIZE + TILE_SIZE / 2,
      row * TILE_SIZE + TILE_SIZE / 2,
      TILE_SIZE / 2 - 1,
      5,
      355,
      false,
      0xffff00
    );
    this._col = col;
    this._row = row;
    scene.add.existing(this);
  }

  get col(): number { return this._col; }
  get row(): number { return this._row; }
  get direction(): Direction { return this._direction; }

  setSpeedMultiplier(m: number): void { this._speedMultiplier = m; }
  setNextDirection(dir: Direction): void { this._nextDirection = dir; }

  /**
   * Move Pac-Man. Called from GameScene.update().
   * Returns the new tile if a tile boundary was crossed, null otherwise.
   * MazeManager collision is used to validate turns and movement.
   */
  move(delta: number, maze: MazeManager): { col: number; row: number } | null {
    // Full movement implemented in Phase 2
    void delta; void maze;
    return null;
  }

  /** Snap to the centre of the current tile (used on spawn/respawn). */
  snapToTile(col: number, row: number): void {
    this._col = col;
    this._row = row;
    this._direction = 'NONE';
    this._nextDirection = 'NONE';
    const cx = col * TILE_SIZE + TILE_SIZE / 2;
    const cy = row * TILE_SIZE + TILE_SIZE / 2;
    this.setPosition(cx, cy);
  }

  /** Speed in pixels per second. */
  get speed(): number {
    return BASE_SPEED * this._speedMultiplier;
  }
}
