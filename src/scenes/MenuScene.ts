import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';
import { ANIMS, TEXTURES } from '../config/VisualKeys';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x05060f, 0x05060f, 0x131a55, 0x131a55, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const mazeGlow = this.add.graphics();
    mazeGlow.lineStyle(2, 0x2f58ff, 0.5);
    mazeGlow.strokeRoundedRect(18, 48, GAME_WIDTH - 36, GAME_HEIGHT - 108, 10);

    const titleShadow = this.add
      .text(cx + 2, GAME_HEIGHT * 0.22 + 2, 'PAC-MAN', {
        fontSize: '32px',
        color: '#1c2f8a',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT * 0.22, 'PAC-MAN', {
        fontSize: '32px',
        color: '#ffff00',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const pacman = this.add.sprite(46, GAME_HEIGHT * 0.38, TEXTURES.PACMAN_CLOSED).setScale(1.3);
    pacman.play(ANIMS.PACMAN_CHOMP);

    const ghosts = [
      this.add.sprite(86, GAME_HEIGHT * 0.38, TEXTURES.GHOST_BLINKY_A),
      this.add.sprite(112, GAME_HEIGHT * 0.38, TEXTURES.GHOST_PINKY_A),
      this.add.sprite(138, GAME_HEIGHT * 0.38, TEXTURES.GHOST_INKY_A),
      this.add.sprite(164, GAME_HEIGHT * 0.38, TEXTURES.GHOST_CLYDE_A),
    ];
    ghosts[0].play(ANIMS.GHOST_BLINKY);
    ghosts[1].play(ANIMS.GHOST_PINKY);
    ghosts[2].play(ANIMS.GHOST_INKY);
    ghosts[3].play(ANIMS.GHOST_CLYDE);

    const highScore = localStorage.getItem('pacman_high_score') ?? '0';
    this.add
      .text(cx, GAME_HEIGHT * 0.5, `HIGH SCORE  ${highScore}`, {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT * 0.58, 'PHASE 5 BUILD', {
        fontSize: '10px',
        color: '#7de2ff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    const insertCoin = this.add
      .text(cx, GAME_HEIGHT * 0.72, 'PRESS SPACE TO START', {
        fontSize: '12px',
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

    this.tweens.add({
      targets: [titleShadow, ...ghosts, pacman],
      y: '-=4',
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      stagger: 60,
    });

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
  }
}
