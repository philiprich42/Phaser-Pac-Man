import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';
import { ANIMS, TEXTURES } from '../config/VisualKeys';
import { getAudioManager } from '../systems/AudioManager';

interface GameOverData {
  score: number;
  level: number;
}

export class GameOverScene extends Phaser.Scene {
  private lastScore = 0;
  private lastLevel = 1;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    getAudioManager(this.game).stopAll();
    const { score = 0, level = 1 } = data ?? {};
    this.lastScore = score;
    this.lastLevel = level;

    // Persist high score
    const previous = parseInt(localStorage.getItem('pacman_high_score') ?? '0', 10);
    if (score > previous) {
      localStorage.setItem('pacman_high_score', String(score));
    }

    const cx = GAME_WIDTH / 2;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x140404, 0x140404, 0x3f0c0c, 0x3f0c0c, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const banner = this.add.graphics();
    banner.fillStyle(0x1a0000, 0.85);
    banner.fillRoundedRect(20, 56, GAME_WIDTH - 40, GAME_HEIGHT - 112, 10);
    banner.lineStyle(2, 0xff4d4d, 0.7);
    banner.strokeRoundedRect(20, 56, GAME_WIDTH - 40, GAME_HEIGHT - 112, 10);

    const pacman = this.add.sprite(cx - 28, GAME_HEIGHT * 0.27, TEXTURES.PACMAN_CLOSED).setScale(1.2);
    pacman.play(ANIMS.PACMAN_CHOMP);
    pacman.setAlpha(0.45);
    const eyes = this.add.sprite(cx + 28, GAME_HEIGHT * 0.27, TEXTURES.GHOST_EYES).setScale(1.2);

    this.add
      .text(cx, GAME_HEIGHT * 0.3, 'GAME OVER', {
        fontSize: '20px',
        color: '#ff0000',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT * 0.46, `SCORE ${score}`, {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT * 0.53, `LEVEL ${level}`, {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    const highScore = localStorage.getItem('pacman_high_score') ?? '0';
    this.add
      .text(cx, GAME_HEIGHT * 0.6, `HIGH SCORE ${highScore}`, {
        fontSize: '10px',
        color: '#7de2ff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(cx, GAME_HEIGHT * 0.74, 'PRESS SPACE TO CONTINUE', {
        fontSize: '12px',
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

    this.tweens.add({
      targets: [pacman, eyes],
      alpha: 0.2,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.start('MenuScene');
    });
  }

  getDebugState(): { scene: string; score: number; level: number; highScore: string | null } {
    return {
      scene: this.scene.key,
      score: this.lastScore,
      level: this.lastLevel,
      highScore: localStorage.getItem('pacman_high_score'),
    };
  }
}
