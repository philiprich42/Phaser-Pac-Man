import { SCORE, STARTING_LIVES } from '../config/Constants';

const HIGH_SCORE_KEY = 'pacman_high_score';

export interface ScoreState {
  score: number;
  lives: number;
  level: number;
}

export class ScoreManager {
  private _score = 0;
  private _highScore = 0;
  private _lives = STARTING_LIVES;
  private _level = 1;
  private _ghostsEatenThisPellet = 0;
  private _extraLifeAwarded = false;

  constructor() {
    this._highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) ?? '0', 10);
  }

  // --- Getters ---

  get score(): number { return this._score; }
  get highScore(): number { return this._highScore; }
  get lives(): number { return this._lives; }
  get level(): number { return this._level; }
  get state(): ScoreState {
    return {
      score: this._score,
      lives: this._lives,
      level: this._level,
    };
  }

  // --- Actions ---

  addDot(): void {
    this._add(SCORE.DOT);
  }

  addPowerPellet(): void {
    this._ghostsEatenThisPellet = 0;
    this._add(SCORE.POWER_PELLET);
  }

  addGhostEaten(): number {
    const idx = Math.min(this._ghostsEatenThisPellet, SCORE.GHOST.length - 1);
    const points = SCORE.GHOST[idx];
    this._ghostsEatenThisPellet++;
    this._add(points);
    return points;
  }

  addFruit(points: number): void {
    this._add(points);
  }

  loseLife(): void {
    this._lives = Math.max(0, this._lives - 1);
  }

  addLife(): void {
    this._lives++;
  }

  advanceLevel(): void {
    this._level++;
    this._ghostsEatenThisPellet = 0;
  }

  resetGhostCombo(): void {
    this._ghostsEatenThisPellet = 0;
  }

  saveHighScore(): void {
    if (this._score >= this._highScore && this._score > 0) {
      this._highScore = this._score;
      localStorage.setItem(HIGH_SCORE_KEY, String(this._highScore));
    }
  }

  reset(): void {
    this._score = 0;
    this._lives = STARTING_LIVES;
    this._level = 1;
    this._ghostsEatenThisPellet = 0;
    this._extraLifeAwarded = false;
  }

  restore(state: ScoreState): void {
    this._score = state.score;
    this._lives = state.lives;
    this._level = state.level;
    this._ghostsEatenThisPellet = 0;
    this._extraLifeAwarded = this._score >= SCORE.EXTRA_LIFE_THRESHOLD;
    if (this._score > this._highScore) {
      this._highScore = this._score;
    }
  }

  // --- Private ---

  private _add(points: number): void {
    this._score += points;
    if (!this._extraLifeAwarded && this._score >= SCORE.EXTRA_LIFE_THRESHOLD) {
      this._extraLifeAwarded = true;
      this._lives++;
    }
    if (this._score > this._highScore) {
      this._highScore = this._score;
    }
  }
}
