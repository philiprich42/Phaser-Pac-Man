import Phaser from 'phaser';
import {
  FRUIT_DURATION_MS,
  FRUIT_SPAWN_DOTS,
  GAME_HEIGHT,
  GAME_WIDTH,
  getFruitPoints,
  getSpeedTable,
  TILE_SIZE,
} from '../config/Constants';
import { createPhase2Maze } from '../config/Phase2Maze';
import { TEXTURES } from '../config/VisualKeys';
import { Blinky } from '../entities/Blinky';
import { Clyde } from '../entities/Clyde';
import { Ghost } from '../entities/Ghost';
import { Inky } from '../entities/Inky';
import { PacMan } from '../entities/PacMan';
import { Pinky } from '../entities/Pinky';
import { GhostAI, GhostMode } from '../systems/GhostAI';
import { InputManager } from '../systems/InputManager';
import { MazeManager, TileType } from '../systems/MazeManager';
import { ScoreManager } from '../systems/ScoreManager';

const PLAYER_SPAWN = { col: 14, row: 26 };
const GHOST_SPAWNS = {
  Blinky: { col: 14, row: 17 },
  Pinky: { col: 12, row: 17 },
  Inky: { col: 14, row: 15 },
  Clyde: { col: 16, row: 17 },
} as const;
const GHOST_HOUSE_TILE = { col: 14, row: 17 };
const FRUIT_TILE = { col: 14, row: 20 };

/**
 * Main gameplay scene. Wired up incrementally across phases 2–7.
 */
export class GameScene extends Phaser.Scene {
  private readonly maze = new MazeManager();
  private readonly score = new ScoreManager();
  private readonly eatenGhosts = new Set<Ghost>();
  private readonly fruitSpawnMilestones = new Set<number>();

  private inputManager!: InputManager;
  private pacman!: PacMan;
  private ghostAI!: GhostAI;
  private blinky!: Blinky;
  private ghosts: Ghost[] = [];

  private wallGraphics!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private dotSprites = new Map<number, Phaser.GameObjects.Arc>();
  private fruitSprite: Phaser.GameObjects.Sprite | null = null;
  private fruitTimer: Phaser.Time.TimerEvent | null = null;
  private popupText: Phaser.GameObjects.Text | null = null;
  private backdrop!: Phaser.GameObjects.Graphics;

  private isLevelCleared = false;
  private isGameOver = false;
  private isRespawning = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.score.reset();
    this.inputManager = new InputManager(this);
    this._createHud();
    this._buildActors();
    this._startLevel();

    this.input.keyboard!.once('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }

  update(_time: number, delta: number): void {
    if (this.isLevelCleared || this.isGameOver || this.isRespawning) {
      return;
    }

    const deltaSeconds = delta / 1000;
    this.ghostAI.update(deltaSeconds);
    this._applySpeedMultipliers();

    this.pacman.setNextDirection(this.inputManager.poll());

    const crossedTile = this.pacman.move(deltaSeconds, this.maze);
    if (crossedTile) {
      this._handleConsumedTile(crossedTile.col, crossedTile.row);
    }

    this._handleFruitCollision();
    if (this._handleGhostCollision()) {
      return;
    }

    this._updateGhosts(deltaSeconds);
    this._updateGhostAppearance();

    this._handleFruitCollision();
    this._handleGhostCollision();
    this._updateHud();
  }

  private _createHud(): void {
    this.backdrop = this.add.graphics().setDepth(-1);
    this.backdrop.fillGradientStyle(0x02030a, 0x02030a, 0x0d1140, 0x0d1140, 1);
    this.backdrop.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.scoreText = this.add.text(8, 8, '', {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setDepth(10);

    this.levelText = this.add.text(8, 20, '', {
      fontSize: '10px',
      color: '#ffb852',
      fontFamily: 'monospace',
    }).setDepth(10);

    this.livesText = this.add.text(8, 32, '', {
      fontSize: '10px',
      color: '#ffff00',
      fontFamily: 'monospace',
    }).setDepth(10);

    this.statusText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
        fontSize: '12px',
        color: '#ffff00',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setVisible(false);
  }

  private _buildActors(): void {
    this.pacman = new PacMan(this, PLAYER_SPAWN.col, PLAYER_SPAWN.row);
    this.pacman.setDepth(2);
    this.blinky = new Blinky(this, GHOST_SPAWNS.Blinky.col, GHOST_SPAWNS.Blinky.row);
    this.blinky.setDepth(2);
    this.ghosts = [
      this.blinky,
      new Pinky(this, GHOST_SPAWNS.Pinky.col, GHOST_SPAWNS.Pinky.row),
      new Inky(this, GHOST_SPAWNS.Inky.col, GHOST_SPAWNS.Inky.row),
      new Clyde(this, GHOST_SPAWNS.Clyde.col, GHOST_SPAWNS.Clyde.row),
    ];

    for (const ghost of this.ghosts) {
      ghost.setDepth(2);
    }
  }

  private _startLevel(): void {
    this.isLevelCleared = false;
    this.isGameOver = false;
    this.isRespawning = false;
    this.fruitSpawnMilestones.clear();
    this.eatenGhosts.clear();
    this.statusText.setVisible(false);
    this._clearFruit();
    this._clearPopup();

    this.maze.loadTiles(createPhase2Maze());
    this.ghostAI = new GhostAI(this.score.level);
    this._renderMaze();
    this._resetActorPositions();
    this._applySpeedMultipliers();
    this._updateGhostAppearance();
    this._updateHud();
  }

  private _resetActorPositions(): void {
    this.pacman.snapToTile(PLAYER_SPAWN.col, PLAYER_SPAWN.row);
    this.blinky.snapToTile(GHOST_SPAWNS.Blinky.col, GHOST_SPAWNS.Blinky.row);
    this.ghosts[1].snapToTile(GHOST_SPAWNS.Pinky.col, GHOST_SPAWNS.Pinky.row);
    this.ghosts[2].snapToTile(GHOST_SPAWNS.Inky.col, GHOST_SPAWNS.Inky.row);
    this.ghosts[3].snapToTile(GHOST_SPAWNS.Clyde.col, GHOST_SPAWNS.Clyde.row);
    this.eatenGhosts.clear();
  }

  private _applySpeedMultipliers(): void {
    const [pacmanNormal, pacmanFrightened, _pacmanDot, ghostNormal, ghostFrightened] =
      getSpeedTable(this.score.level);

    this.pacman.setSpeedMultiplier(
      this.ghostAI.mode === 'frightened' ? pacmanFrightened : pacmanNormal
    );

    for (const ghost of this.ghosts) {
      if (this.eatenGhosts.has(ghost)) {
        ghost.setSpeedMultiplier(1.1);
        continue;
      }

      ghost.setSpeedMultiplier(
        this.ghostAI.mode === 'frightened' ? ghostFrightened : ghostNormal
      );
    }
  }

  private _updateHud(): void {
    this.scoreText.setText(`SCORE ${this.score.score.toString().padStart(4, '0')}`);
    this.levelText.setText(
      `LEVEL ${this.score.level}  DOTS ${this.maze.remainingDots}  MODE ${this.ghostAI.mode.toUpperCase()}`
    );
    this.livesText.setText(`LIVES ${this.score.lives}`);
  }

  private _renderMaze(): void {
    this.wallGraphics?.destroy();
    for (const dot of this.dotSprites.values()) {
      dot.destroy();
    }
    this.dotSprites.clear();

    this.wallGraphics = this.add.graphics();
    this.wallGraphics.setDepth(0);
    this.wallGraphics.fillStyle(0x0019a8);

    for (let row = 0; row < this.maze.rows; row++) {
      for (let col = 0; col < this.maze.cols; col++) {
        const tile = this.maze.tileAt(col, row);
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        if (tile === TileType.Wall) {
          this.wallGraphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          continue;
        }

        if (tile !== TileType.Dot && tile !== TileType.PowerPellet) {
          continue;
        }

        const radius = tile === TileType.PowerPellet ? 3 : 1.5;
        const dot = this.add.circle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, radius, 0xf8d090);
        dot.setDepth(1);
        this.dotSprites.set(row * this.maze.cols + col, dot);
      }
    }
  }

  private _updateGhosts(deltaSeconds: number): void {
    for (const ghost of this.ghosts) {
      const mode = this._ghostModeFor(ghost);
      const crossedTile = ghost.move(deltaSeconds, mode, this.pacman, this.maze, this.blinky);

      if (
        crossedTile &&
        this.eatenGhosts.has(ghost) &&
        crossedTile.col === GHOST_HOUSE_TILE.col &&
        crossedTile.row === GHOST_HOUSE_TILE.row
      ) {
        this.eatenGhosts.delete(ghost);
      }
    }
  }

  private _ghostModeFor(ghost: Ghost): GhostMode {
    return this.eatenGhosts.has(ghost) ? 'eaten' : this.ghostAI.mode;
  }

  private _updateGhostAppearance(): void {
    for (const ghost of this.ghosts) {
      ghost.setAppearance(this.ghostAI.mode, this.ghostAI.isFlashing, this.eatenGhosts.has(ghost));
    }
  }

  private _handleConsumedTile(col: number, row: number): void {
    const consumed = this.maze.consumeTile(col, row);
    if (consumed === TileType.Empty) {
      return;
    }

    const spriteKey = row * this.maze.cols + col;
    const dotSprite = this.dotSprites.get(spriteKey);
    if (dotSprite) {
      dotSprite.destroy();
      this.dotSprites.delete(spriteKey);
    }

    if (consumed === TileType.PowerPellet) {
      this.score.addPowerPellet();
      this.ghostAI.enterFrightened();
      this.eatenGhosts.clear();
    } else {
      this.score.addDot();
    }

    this._maybeSpawnFruit();

    if (this.maze.isCleared) {
      this._handleLevelClear();
    }
  }

  private _maybeSpawnFruit(): void {
    const dotsEaten = this.maze.totalDots - this.maze.remainingDots;
    if (!FRUIT_SPAWN_DOTS.includes(dotsEaten as (typeof FRUIT_SPAWN_DOTS)[number])) {
      return;
    }

    if (this.fruitSpawnMilestones.has(dotsEaten)) {
      return;
    }

    this.fruitSpawnMilestones.add(dotsEaten);
    this._spawnFruit();
  }

  private _spawnFruit(): void {
    this._clearFruit();
    const center = this.maze.tileCenter(FRUIT_TILE.col, FRUIT_TILE.row);
    this.fruitSprite = this.add.sprite(center.x, center.y, TEXTURES.FRUIT_CHERRY).setDepth(2);
    this.fruitTimer = this.time.delayedCall(FRUIT_DURATION_MS, () => {
      this._clearFruit();
    });
  }

  private _handleFruitCollision(): void {
    if (!this.fruitSprite) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      this.pacman.x,
      this.pacman.y,
      this.fruitSprite.x,
      this.fruitSprite.y
    );

    if (distance > TILE_SIZE * 0.75) {
      return;
    }

    const points = getFruitPoints(this.score.level);
    this.score.addFruit(points);
    this._showPopup(String(points), this.fruitSprite.x, this.fruitSprite.y - 10, '#ff2f4f');
    this._clearFruit();
  }

  private _handleGhostCollision(): boolean {
    for (const ghost of this.ghosts) {
      const distance = Phaser.Math.Distance.Between(this.pacman.x, this.pacman.y, ghost.x, ghost.y);
      if (distance > TILE_SIZE * 0.75) {
        continue;
      }

      if (this.ghostAI.mode === 'frightened' && !this.eatenGhosts.has(ghost)) {
        this.eatenGhosts.add(ghost);
        const points = this.score.addGhostEaten();
        this._showPopup(String(points), ghost.x, ghost.y - 10, '#00ffff');
        this._applySpeedMultipliers();
        return false;
      }

      if (this.eatenGhosts.has(ghost)) {
        continue;
      }

      this._handlePlayerDeath();
      return true;
    }

    return false;
  }

  private _handlePlayerDeath(): void {
    this.isRespawning = true;
    this.score.loseLife();
    this.score.resetGhostCombo();
    this._clearFruit();
    this.statusText.setText('CAUGHT');
    this.statusText.setVisible(true);
    this._updateHud();

    if (this.score.lives === 0) {
      this.isGameOver = true;
      this.score.saveHighScore();
      this.time.delayedCall(900, () => {
        this.scene.start('GameOverScene', {
          score: this.score.score,
          level: this.score.level,
        });
      });
      return;
    }

    this.time.delayedCall(900, () => {
      this.ghostAI.reset(this.score.level);
      this._resetActorPositions();
      this._applySpeedMultipliers();
      this._updateGhostAppearance();
      this.statusText.setVisible(false);
      this.isRespawning = false;
    });
  }

  private _handleLevelClear(): void {
    this.isLevelCleared = true;
    this.statusText.setText('LEVEL CLEAR');
    this.statusText.setVisible(true);
    this.score.advanceLevel();
    this.score.resetGhostCombo();
    this._clearFruit();
    this.score.saveHighScore();
    this._updateHud();

    this.time.delayedCall(1200, () => {
      this._startLevel();
    });
  }

  private _showPopup(text: string, x: number, y: number, color: string): void {
    this._clearPopup();
    this.popupText = this.add
      .text(x, y, text, {
        fontSize: '10px',
        color,
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(9);

    this.tweens.add({
      targets: this.popupText,
      y: y - 12,
      alpha: 0,
      duration: 600,
      onComplete: () => {
        this._clearPopup();
      },
    });
  }

  private _clearPopup(): void {
    this.popupText?.destroy();
    this.popupText = null;
  }

  private _clearFruit(): void {
    this.fruitTimer?.destroy();
    this.fruitTimer = null;
    this.fruitSprite?.destroy();
    this.fruitSprite = null;
  }
}
