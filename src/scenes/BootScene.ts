import Phaser from 'phaser';
import { ANIMS, TEXTURES } from '../config/VisualKeys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Progress bar
    const { width, height } = this.scale;
    const bar = this.add.graphics();
    const box = this.add.graphics();

    box.fillStyle(0x222222);
    box.fillRect(width / 2 - 100, height / 2 - 10, 200, 20);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0xffff00);
      bar.fillRect(width / 2 - 100, height / 2 - 10, 200 * value, 20);
    });

    this.load.on('complete', () => {
      bar.destroy();
      box.destroy();
    });

    // Phase 5 uses procedurally generated textures so the visual pipeline
    // exists even before external sprite sheets are added in a later pass.
  }

  create(): void {
    this._createTextures();
    this._createAnimations();
    this.scene.start('MenuScene');
  }

  private _createTextures(): void {
    if (!this.textures.exists(TEXTURES.PACMAN_CLOSED)) {
      this._createPacmanTexture(TEXTURES.PACMAN_CLOSED, 0);
      this._createPacmanTexture(TEXTURES.PACMAN_HALF, 24);
      this._createPacmanTexture(TEXTURES.PACMAN_OPEN, 42);

      this._createGhostTexture(TEXTURES.GHOST_BLINKY_A, 0xff3b30, 0);
      this._createGhostTexture(TEXTURES.GHOST_BLINKY_B, 0xff3b30, 1);
      this._createGhostTexture(TEXTURES.GHOST_PINKY_A, 0xff9ff3, 0);
      this._createGhostTexture(TEXTURES.GHOST_PINKY_B, 0xff9ff3, 1);
      this._createGhostTexture(TEXTURES.GHOST_INKY_A, 0x3cf7ff, 0);
      this._createGhostTexture(TEXTURES.GHOST_INKY_B, 0x3cf7ff, 1);
      this._createGhostTexture(TEXTURES.GHOST_CLYDE_A, 0xffb347, 0);
      this._createGhostTexture(TEXTURES.GHOST_CLYDE_B, 0xffb347, 1);
      this._createGhostTexture(TEXTURES.GHOST_FRIGHTENED_A, 0x285bff, 0);
      this._createGhostTexture(TEXTURES.GHOST_FRIGHTENED_B, 0x285bff, 1);
      this._createGhostTexture(TEXTURES.GHOST_FLASH_A, 0xffffff, 0);
      this._createGhostTexture(TEXTURES.GHOST_FLASH_B, 0xffffff, 1);
      this._createEyesTexture(TEXTURES.GHOST_EYES);
      this._createCherryTexture(TEXTURES.FRUIT_CHERRY);
    }
  }

  private _createAnimations(): void {
    if (!this.anims.exists(ANIMS.PACMAN_CHOMP)) {
      this.anims.create({
        key: ANIMS.PACMAN_CHOMP,
        frames: [
          { key: TEXTURES.PACMAN_CLOSED },
          { key: TEXTURES.PACMAN_HALF },
          { key: TEXTURES.PACMAN_OPEN },
          { key: TEXTURES.PACMAN_HALF },
        ],
        frameRate: 12,
        repeat: -1,
      });
    }

    this._createGhostAnim(ANIMS.GHOST_BLINKY, TEXTURES.GHOST_BLINKY_A, TEXTURES.GHOST_BLINKY_B);
    this._createGhostAnim(ANIMS.GHOST_PINKY, TEXTURES.GHOST_PINKY_A, TEXTURES.GHOST_PINKY_B);
    this._createGhostAnim(ANIMS.GHOST_INKY, TEXTURES.GHOST_INKY_A, TEXTURES.GHOST_INKY_B);
    this._createGhostAnim(ANIMS.GHOST_CLYDE, TEXTURES.GHOST_CLYDE_A, TEXTURES.GHOST_CLYDE_B);
    this._createGhostAnim(
      ANIMS.GHOST_FRIGHTENED,
      TEXTURES.GHOST_FRIGHTENED_A,
      TEXTURES.GHOST_FRIGHTENED_B
    );
    this._createGhostAnim(ANIMS.GHOST_FLASH, TEXTURES.GHOST_FLASH_A, TEXTURES.GHOST_FLASH_B);
  }

  private _createGhostAnim(key: string, frameA: string, frameB: string): void {
    if (this.anims.exists(key)) {
      return;
    }

    this.anims.create({
      key,
      frames: [{ key: frameA }, { key: frameB }],
      frameRate: 6,
      repeat: -1,
    });
  }

  private _createPacmanTexture(key: string, mouthAngle: number): void {
    const g = this.add.graphics().setVisible(false);
    g.fillStyle(0xffeb3b);
    g.slice(8, 8, 7, Phaser.Math.DegToRad(mouthAngle / 2), Phaser.Math.DegToRad(360 - mouthAngle / 2), false);
    g.fillPath();
    g.generateTexture(key, 16, 16);
    g.destroy();
  }

  private _createGhostTexture(key: string, color: number, footPhase: number): void {
    const g = this.add.graphics().setVisible(false);
    g.fillStyle(color);
    g.fillCircle(8, 7, 6);
    g.fillRect(2, 7, 12, 6);

    g.fillStyle(0x000000);
    for (let i = 0; i < 3; i++) {
      const baseX = 3 + i * 4;
      const offset = (i + footPhase) % 2 === 0 ? 2 : 0;
      g.fillTriangle(baseX, 13, baseX + 2, 15 - offset, baseX + 4, 13);
    }

    g.fillStyle(0xffffff);
    g.fillCircle(6, 7, 1.7);
    g.fillCircle(10, 7, 1.7);
    g.fillStyle(0x1b2a6d);
    g.fillCircle(6.5, 7.2, 0.8);
    g.fillCircle(10.5, 7.2, 0.8);

    g.generateTexture(key, 16, 16);
    g.destroy();
  }

  private _createEyesTexture(key: string): void {
    const g = this.add.graphics().setVisible(false);
    g.fillStyle(0xffffff);
    g.fillCircle(6, 7, 2);
    g.fillCircle(10, 7, 2);
    g.fillStyle(0x1b2a6d);
    g.fillCircle(6.8, 7.1, 1);
    g.fillCircle(10.8, 7.1, 1);
    g.generateTexture(key, 16, 16);
    g.destroy();
  }

  private _createCherryTexture(key: string): void {
    const g = this.add.graphics().setVisible(false);
    g.lineStyle(1, 0x8be35b);
    g.beginPath();
    g.moveTo(8, 3);
    g.lineTo(6, 7);
    g.moveTo(8, 3);
    g.lineTo(10, 7);
    g.strokePath();
    g.fillStyle(0xff2f4f);
    g.fillCircle(5, 9, 3);
    g.fillCircle(11, 9, 3);
    g.generateTexture(key, 16, 16);
    g.destroy();
  }
}
