import Phaser from 'phaser';
import { Ghost } from './Ghost';
import { PacMan } from './PacMan';
import { Tile } from '../utils/PathFinder';

const PINKY_OFFSET = 4; // tiles ahead

const DIR_DELTA: Record<string, [number, number]> = {
  UP:    [0, -PINKY_OFFSET],
  DOWN:  [0,  PINKY_OFFSET],
  LEFT:  [-PINKY_OFFSET, 0],
  RIGHT: [ PINKY_OFFSET, 0],
  NONE:  [0, 0],
};

export class Pinky extends Ghost {
  constructor(scene: Phaser.Scene, col: number, row: number) {
    super(scene, col, row, 'Pinky', 0xffb8ff);
  }

  /**
   * Pinky targets 4 tiles ahead of Pac-Man's current direction.
   * Original game has a famous UP overflow bug: when facing UP, the target is
   * also shifted 4 tiles to the left.  We reproduce this faithfully.
   */
  chaseTarget(pacman: PacMan): Tile {
    const [dc, dr] = DIR_DELTA[pacman.direction] ?? [0, 0];
    // Reproduce original UP overflow: subtract 4 from col when facing UP
    const overflowCol = pacman.direction === 'UP' ? -PINKY_OFFSET : 0;
    return {
      col: pacman.col + dc + overflowCol,
      row: pacman.row + dr,
    };
  }
}
