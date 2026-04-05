import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';

/**
 * Main gameplay scene. Wired up incrementally across phases 2–7.
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Placeholder — replaced in Phase 2
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'GAME SCENE\n(Phase 2)', {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'monospace',
        align: 'center',
      })
      .setOrigin(0.5);

    this.input.keyboard!.once('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }

  update(_time: number, _delta: number): void {
    // Game loop — implemented in Phase 2
  }
}
