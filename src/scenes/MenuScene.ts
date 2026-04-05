import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    this.add
      .text(cx, GAME_HEIGHT * 0.3, 'PAC-MAN', {
        fontSize: '24px',
        color: '#ffff00',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    const highScore = localStorage.getItem('pacman_high_score') ?? '0';
    this.add
      .text(cx, GAME_HEIGHT * 0.45, `HIGH SCORE: ${highScore}`, {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    const insertCoin = this.add
      .text(cx, GAME_HEIGHT * 0.65, 'PRESS SPACE TO START', {
        fontSize: '10px',
        color: '#ffb8ff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    // Blink the prompt
    this.tweens.add({
      targets: insertCoin,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
  }
}
