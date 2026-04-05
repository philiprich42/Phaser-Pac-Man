import Phaser from 'phaser';
import { Ghost } from './Ghost';
import { PacMan } from './PacMan';
import { Tile } from '../utils/PathFinder';

export class Blinky extends Ghost {
  constructor(scene: Phaser.Scene, col: number, row: number) {
    super(scene, col, row, 'Blinky', 0xff0000);
  }

  /** Blinky always targets Pac-Man's current tile. */
  chaseTarget(pacman: PacMan): Tile {
    return { col: pacman.col, row: pacman.row };
  }
}
