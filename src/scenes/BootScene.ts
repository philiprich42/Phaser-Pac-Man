import Phaser from 'phaser';

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

    // Assets will be loaded here in Phase 5
    // this.load.atlas('sprites', 'assets/sprites/sprites.png', 'assets/sprites/sprites.json');
    // this.load.tilemapTiledJSON('maze', 'assets/tilemaps/maze.json');
    // Audio in Phase 6
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
