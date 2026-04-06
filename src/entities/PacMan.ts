import Phaser from 'phaser';
import { TILE_SIZE, BASE_SPEED } from '../config/Constants';
import { ANIMS, TEXTURES } from '../config/VisualKeys';
import { Direction } from '../systems/InputManager';
import { MazeManager } from '../systems/MazeManager';

const DIRECTION_VECTORS: Record<Exclude<Direction, 'NONE'>, { col: number; row: number }> = {
  UP: { col: 0, row: -1 },
  DOWN: { col: 0, row: 1 },
  LEFT: { col: -1, row: 0 },
  RIGHT: { col: 1, row: 0 },
};

export class PacMan extends Phaser.GameObjects.Sprite {
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
      TEXTURES.PACMAN_CLOSED
    );
    this._col = col;
    this._row = row;
    scene.add.existing(this);
    this.play(ANIMS.PACMAN_CHOMP);
    this.setOrigin(0.5);
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
    let remaining = this.speed * delta;
    let crossedTile: { col: number; row: number } | null = null;

    while (remaining > 0) {
      if (this._isCentered()) {
        this._snapToCurrentTile();

        if (this._nextDirection !== 'NONE' && this._canMove(this._nextDirection, maze)) {
          this._direction = this._nextDirection;
        }

        if (this._direction === 'NONE') {
          break;
        }

        if (!this._canMove(this._direction, maze)) {
          this._direction = 'NONE';
          break;
        }
      }

      if (this._direction === 'NONE') {
        this.anims.stop();
        this.setTexture(TEXTURES.PACMAN_CLOSED);
        break;
      }

      const target = this._getTarget(this._direction, maze);
      const distanceToTarget = this._distanceTo(target.x, target.y);
      const step = Math.min(remaining, distanceToTarget);

      this.setPosition(
        this.x + Math.sign(target.x - this.x) * step,
        this.y + Math.sign(target.y - this.y) * step
      );
      remaining -= step;

      if (step === distanceToTarget) {
        this._col = target.col;
        this._row = target.row;

        if (this._direction === 'LEFT' && target.col === maze.cols - 1) {
          this.setPosition(target.x + maze.cols * TILE_SIZE, target.y);
        } else if (this._direction === 'RIGHT' && target.col === 0) {
          this.setPosition(target.x - maze.cols * TILE_SIZE, target.y);
        }

        this.setPosition(
          this._col * TILE_SIZE + TILE_SIZE / 2,
          this._row * TILE_SIZE + TILE_SIZE / 2
        );
        crossedTile = { col: this._col, row: this._row };
      }
    }

    this._updateVisualDirection();
    return crossedTile;
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
    this.setTexture(TEXTURES.PACMAN_CLOSED);
    this.setRotation(0);
  }

  /** Speed in pixels per second. */
  get speed(): number {
    return BASE_SPEED * this._speedMultiplier;
  }

  private _isCentered(): boolean {
    const center = this._tileCenter(this._col, this._row);
    return this._distanceTo(center.x, center.y) < 0.01;
  }

  private _snapToCurrentTile(): void {
    const center = this._tileCenter(this._col, this._row);
    this.setPosition(center.x, center.y);
  }

  private _tileCenter(col: number, row: number): { x: number; y: number } {
    return {
      x: col * TILE_SIZE + TILE_SIZE / 2,
      y: row * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  private _distanceTo(x: number, y: number): number {
    return Math.hypot(x - this.x, y - this.y);
  }

  private _canMove(direction: Direction, maze: MazeManager): boolean {
    if (direction === 'NONE') {
      return false;
    }

    const { col, row } = this._nextTile(direction, maze);
    return maze.isWalkable(col, row);
  }

  private _getTarget(direction: Exclude<Direction, 'NONE'>, maze: MazeManager): {
    col: number;
    row: number;
    x: number;
    y: number;
  } {
    const { col, row } = this._nextTile(direction, maze);
    const center = this._tileCenter(col, row);

    if (direction === 'LEFT' && this._col === 0 && row === this._row) {
      return { col, row, x: this.x - TILE_SIZE, y: center.y };
    }

    if (direction === 'RIGHT' && this._col === maze.cols - 1 && row === this._row) {
      return { col, row, x: this.x + TILE_SIZE, y: center.y };
    }

    return { col, row, x: center.x, y: center.y };
  }

  private _nextTile(direction: Exclude<Direction, 'NONE'>, maze: MazeManager): {
    col: number;
    row: number;
  } {
    const vector = DIRECTION_VECTORS[direction];
    let col = this._col + vector.col;
    const row = this._row + vector.row;

    if (row === this._row) {
      if (col < 0) {
        col = maze.cols - 1;
      } else if (col >= maze.cols) {
        col = 0;
      }
    }

    return { col, row };
  }

  private _updateVisualDirection(): void {
    switch (this._direction) {
      case 'UP':
        this.setRotation(-Math.PI / 2);
        if (!this.anims.isPlaying) this.play(ANIMS.PACMAN_CHOMP);
        break;
      case 'DOWN':
        this.setRotation(Math.PI / 2);
        if (!this.anims.isPlaying) this.play(ANIMS.PACMAN_CHOMP);
        break;
      case 'LEFT':
        this.setRotation(Math.PI);
        if (!this.anims.isPlaying) this.play(ANIMS.PACMAN_CHOMP);
        break;
      case 'RIGHT':
        this.setRotation(0);
        if (!this.anims.isPlaying) this.play(ANIMS.PACMAN_CHOMP);
        break;
      case 'NONE':
        this.anims.stop();
        this.setTexture(TEXTURES.PACMAN_CLOSED);
        break;
    }
  }
}
