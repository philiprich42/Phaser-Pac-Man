import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';

interface GameOverData {
  score: number;
  level: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    const { score = 0, level = 1 } = data ?? {};

    // Persist high score
    const previous = parseInt(localStorage.getItem('pacman_high_score') ?? '0', 10);
    if (score > previous) {
      localStorage.setItem('pacman_high_score', String(score));
    }

    const cx = GAME_WIDTH / 2;

    this.add
      .text(cx, GAME_HEIGHT * 0.3, 'GAME OVER', {
        fontSize: '16px',
        color: '#ff0000',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT * 0.45, `SCORE: ${score}   LEVEL: ${level}`, {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(cx, GAME_HEIGHT * 0.65, 'PRESS SPACE TO CONTINUE', {
        fontSize: '10px',
        color: '#ffb8ff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.start('MenuScene');
    });
  }
}
