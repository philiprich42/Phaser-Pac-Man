import Phaser from 'phaser';
import { Ghost } from './Ghost';
import { PacMan } from './PacMan';
import { Tile, tileDistance } from '../utils/PathFinder';
import { CLYDE_SCATTER_THRESHOLD, SCATTER_TARGETS } from '../config/Constants';

export class Clyde extends Ghost {
  constructor(scene: Phaser.Scene, col: number, row: number) {
    super(scene, col, row, 'Clyde', 0xffb852);
  }

  /**
   * Clyde targets Pac-Man when farther than 8 tiles away.
   * When within 8 tiles he retreats to his scatter corner (bottom-left).
   */
  chaseTarget(pacman: PacMan): Tile {
    const me: Tile = { col: this._col, row: this._row };
    const pm: Tile = { col: pacman.col, row: pacman.row };
    if (tileDistance(me, pm) > CLYDE_SCATTER_THRESHOLD) {
      return pm;
    }
    const [col, row] = SCATTER_TARGETS['Clyde'];
    return { col, row };
  }
}
