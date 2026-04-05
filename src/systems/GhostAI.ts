import { getGhostModeTimings, getFrightenedDuration } from '../config/Constants';

export type GhostMode = 'scatter' | 'chase' | 'frightened' | 'eaten';

export interface GhostAIState {
  mode: GhostMode;
  previousMode: GhostMode; // mode to resume after frightened/eaten
  phaseIndex: number;      // index into the scatter/chase timing sequence
  phaseElapsed: number;    // seconds elapsed in the current scatter/chase phase
  frightenedElapsed: number;
  frightenedDuration: number;
  isFlashing: boolean;
}

/**
 * Pure state machine for ghost mode management.  No Phaser dependency.
 *
 * Usage: call `update(delta)` each frame from GameScene.
 * The GameScene/Ghost entities read `.mode` to determine movement behaviour.
 */
export class GhostAI {
  private _state: GhostAIState;
  private _timings: number[];

  constructor(private _level: number) {
    this._timings = getGhostModeTimings(_level);
    this._state = {
      mode: 'scatter',
      previousMode: 'scatter',
      phaseIndex: 0,
      phaseElapsed: 0,
      frightenedElapsed: 0,
      frightenedDuration: getFrightenedDuration(_level),
      isFlashing: false,
    };
  }

  get mode(): GhostMode { return this._state.mode; }
  get isFlashing(): boolean { return this._state.isFlashing; }
  get state(): Readonly<GhostAIState> { return this._state; }

  /** delta in seconds */
  update(delta: number): void {
    const s = this._state;

    if (s.mode === 'frightened') {
      s.frightenedElapsed += delta;

      // Flash warning
      const remaining = s.frightenedDuration - s.frightenedElapsed;
      s.isFlashing = remaining <= 2 && remaining > 0;

      if (s.frightenedElapsed >= s.frightenedDuration) {
        this._exitFrightened();
      }
      return;
    }

    if (s.mode === 'eaten') {
      // Eaten ghosts return to house; transition handled externally via enterHouse()
      return;
    }

    // Scatter / Chase phase advancement
    s.phaseElapsed += delta;
    const phaseDuration = this._timings[s.phaseIndex] ?? Infinity;

    if (s.phaseElapsed >= phaseDuration && phaseDuration !== Infinity) {
      s.phaseIndex++;
      s.phaseElapsed = 0;
      s.mode = s.phaseIndex % 2 === 0 ? 'scatter' : 'chase';
    }
  }

  /** Call when Pac-Man eats a power pellet. */
  enterFrightened(): void {
    const s = this._state;
    if (s.mode !== 'eaten') {
      s.previousMode = s.mode;
    }
    s.mode = 'frightened';
    s.frightenedElapsed = 0;
    s.isFlashing = false;
  }

  /** Call when ghost reaches the house after being eaten. */
  enterHouse(): void {
    this._exitFrightened();
  }

  private _exitFrightened(): void {
    const s = this._state;
    s.mode = s.previousMode;
    s.frightenedElapsed = 0;
    s.isFlashing = false;
  }

  /** Reset to the beginning of the schedule (new level or player death). */
  reset(level?: number): void {
    if (level !== undefined) {
      this._level = level;
      this._timings = getGhostModeTimings(level);
    }
    this._state = {
      mode: 'scatter',
      previousMode: 'scatter',
      phaseIndex: 0,
      phaseElapsed: 0,
      frightenedElapsed: 0,
      frightenedDuration: getFrightenedDuration(this._level),
      isFlashing: false,
    };
  }
}
