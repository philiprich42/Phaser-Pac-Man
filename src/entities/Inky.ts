import Phaser from 'phaser';
import { Ghost } from './Ghost';
import { PacMan } from './PacMan';
import { Tile } from '../utils/PathFinder';

const DIR_DELTA: Record<string, [number, number]> = {
  UP:    [0, -2],
  DOWN:  [0,  2],
  LEFT:  [-2, 0],
  RIGHT: [ 2, 0],
  NONE:  [0, 0],
};

export class Inky extends Ghost {
  constructor(scene: Phaser.Scene, col: number, row: number) {
    super(scene, col, row, 'Inky', 'ghost-inky-a', 'ghost-inky');
  }

  /**
   * Inky's target: take 2 tiles ahead of Pac-Man, then double the vector from
   * Blinky to that point.
   *
   *   pivot = pacman_pos + 2 * facing_dir
   *   target = pivot + (pivot - blinky_pos)   (i.e. reflect Blinky through pivot)
   */
  chaseTarget(pacman: PacMan, blinky?: Ghost): Tile {
    const [dc, dr] = DIR_DELTA[pacman.direction] ?? [0, 0];
    // Reproduce original UP overflow for the pivot calculation
    const overflowCol = pacman.direction === 'UP' ? -2 : 0;
    const pivotCol = pacman.col + dc + overflowCol;
    const pivotRow = pacman.row + dr;

    if (!blinky) {
      return { col: pivotCol, row: pivotRow };
    }

    return {
      col: pivotCol + (pivotCol - blinky.col),
      row: pivotRow + (pivotRow - blinky.row),
    };
  }
}
