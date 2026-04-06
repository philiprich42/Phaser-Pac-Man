import Phaser from 'phaser';

type MaybeAudioContext = AudioContext | null;

export class AudioManager {
  private context: MaybeAudioContext = null;
  private masterGain: GainNode | null = null;
  private wakaInterval: number | null = null;
  private powerOscillator: OscillatorNode | null = null;
  private powerGain: GainNode | null = null;

  constructor(private readonly game: Phaser.Game) {}

  unlock(): void {
    const manager = this.game.sound as Phaser.Sound.WebAudioSoundManager | Phaser.Sound.BaseSoundManager;
    const candidate = 'context' in manager ? manager.context : null;
    if (!candidate) {
      return;
    }

    this.context = candidate as AudioContext;
    if (!this.masterGain) {
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.18;
      this.masterGain.connect(this.context.destination);
    }

    if (this.context.state === 'suspended') {
      void this.context.resume();
    }
  }

  stopAll(): void {
    this.stopWakaLoop();
    this.stopPowerPelletLoop();
  }

  playIntro(): void {
    this._playSequence([
      [784, 0.08, 'square', 0.16],
      [988, 0.1, 'square', 0.16],
      [1175, 0.12, 'square', 0.16],
      [1568, 0.18, 'square', 0.2],
    ], 0.02);
  }

  startWakaLoop(): void {
    if (this.wakaInterval !== null) {
      return;
    }

    this.playWakaOnce();
    this.wakaInterval = window.setInterval(() => {
      this.playWakaOnce();
    }, 180);
  }

  stopWakaLoop(): void {
    if (this.wakaInterval !== null) {
      window.clearInterval(this.wakaInterval);
      this.wakaInterval = null;
    }
  }

  playWakaOnce(): void {
    this._playSequence([
      [620, 0.025, 'square', 0.08],
      [420, 0.03, 'square', 0.07],
    ], 0.012);
  }

  startPowerPelletLoop(): void {
    if (!this._ready()) {
      return;
    }

    if (this.powerOscillator || !this.context || !this.masterGain) {
      return;
    }

    this.powerGain = this.context.createGain();
    this.powerGain.gain.value = 0.04;
    this.powerOscillator = this.context.createOscillator();
    this.powerOscillator.type = 'sawtooth';
    this.powerOscillator.frequency.setValueAtTime(180, this.context.currentTime);
    this.powerOscillator.frequency.linearRampToValueAtTime(210, this.context.currentTime + 0.4);
    this.powerOscillator.connect(this.powerGain);
    this.powerGain.connect(this.masterGain);
    this.powerOscillator.start();
  }

  stopPowerPelletLoop(): void {
    this.powerOscillator?.stop();
    this.powerOscillator?.disconnect();
    this.powerGain?.disconnect();
    this.powerOscillator = null;
    this.powerGain = null;
  }

  playEatGhost(): void {
    this._playSequence([
      [1046, 0.06, 'square', 0.16],
      [1318, 0.08, 'square', 0.16],
      [1568, 0.1, 'square', 0.16],
    ], 0.01);
  }

  playDeath(): void {
    this._playSequence([
      [520, 0.08, 'sawtooth', 0.14],
      [420, 0.08, 'sawtooth', 0.13],
      [320, 0.08, 'sawtooth', 0.12],
      [220, 0.12, 'triangle', 0.11],
      [140, 0.16, 'triangle', 0.1],
    ], 0.03);
  }

  playLevelClear(): void {
    this._playSequence([
      [523, 0.08, 'square', 0.16],
      [659, 0.08, 'square', 0.16],
      [784, 0.08, 'square', 0.16],
      [1046, 0.16, 'square', 0.18],
    ], 0.03);
  }

  playFruit(): void {
    this._playSequence([
      [880, 0.05, 'triangle', 0.14],
      [1175, 0.08, 'triangle', 0.14],
    ], 0.015);
  }

  private _playSequence(
    tones: Array<[frequency: number, duration: number, type: OscillatorType, gain: number]>,
    gap: number
  ): void {
    if (!this._ready() || !this.context) {
      return;
    }

    let at = this.context.currentTime;
    for (const [frequency, duration, type, gain] of tones) {
      this._playTone(frequency, duration, type, gain, at);
      at += duration + gap;
    }
  }

  private _playTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    gain: number,
    startAt: number
  ): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const toneGain = this.context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    toneGain.gain.setValueAtTime(0.001, startAt);
    toneGain.gain.exponentialRampToValueAtTime(gain, startAt + 0.01);
    toneGain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

    oscillator.connect(toneGain);
    toneGain.connect(this.masterGain);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  }

  private _ready(): boolean {
    this.unlock();
    return !!this.context && !!this.masterGain;
  }
}

export function getAudioManager(game: Phaser.Game): AudioManager {
  const registry = game.registry;
  const existing = registry.get('audio-manager') as AudioManager | undefined;
  if (existing) {
    return existing;
  }

  const created = new AudioManager(game);
  registry.set('audio-manager', created);
  return created;
}
