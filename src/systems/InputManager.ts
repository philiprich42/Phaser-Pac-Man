import Phaser from 'phaser';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';

const SWIPE_THRESHOLD = 20; // minimum pixel distance for a swipe

export class InputManager {
  private _current: Direction = 'NONE';
  private _buffered: Direction = 'NONE';
  private _keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
  };

  private _swipeStart: { x: number; y: number } | null = null;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this._keys = {
      up:    kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      w:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Touch / swipe
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this._swipeStart = { x: p.x, y: p.y };
    });

    scene.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!this._swipeStart) return;
      const dx = p.x - this._swipeStart.x;
      const dy = p.y - this._swipeStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= SWIPE_THRESHOLD) {
        const dir = Math.abs(dx) > Math.abs(dy)
          ? (dx > 0 ? 'RIGHT' : 'LEFT')
          : (dy > 0 ? 'DOWN' : 'UP');
        this._buffer(dir as Direction);
      }
      this._swipeStart = null;
    });
  }

  /** Call once per frame. Returns the direction Pac-Man should attempt to move. */
  poll(): Direction {
    if (this._justPressed(this._keys.up, this._keys.w)) this._buffer('UP');
    if (this._justPressed(this._keys.down, this._keys.s)) this._buffer('DOWN');
    if (this._justPressed(this._keys.left, this._keys.a)) this._buffer('LEFT');
    if (this._justPressed(this._keys.right, this._keys.d)) this._buffer('RIGHT');

    // Also allow held keys if no buffer pending
    if (this._buffered === 'NONE') {
      if (this._held(this._keys.up, this._keys.w)) this._buffer('UP');
      if (this._held(this._keys.down, this._keys.s)) this._buffer('DOWN');
      if (this._held(this._keys.left, this._keys.a)) this._buffer('LEFT');
      if (this._held(this._keys.right, this._keys.d)) this._buffer('RIGHT');
    }

    return this._buffered !== 'NONE' ? this._buffered : this._current;
  }

  /** Called by PacMan when it successfully changes direction. */
  consumeBuffer(): void {
    if (this._buffered !== 'NONE') {
      this._current = this._buffered;
      this._buffered = 'NONE';
    }
  }

  /** Called by PacMan when it cannot turn yet (buffered input kept for next frame). */
  keepBuffer(): void {
    // Buffer remains; do nothing
  }

  get current(): Direction { return this._current; }
  get buffered(): Direction { return this._buffered; }

  private _buffer(dir: Direction): void {
    this._buffered = dir;
  }

  private _justPressed(primary: Phaser.Input.Keyboard.Key, secondary: Phaser.Input.Keyboard.Key): boolean {
    return Phaser.Input.Keyboard.JustDown(primary) || Phaser.Input.Keyboard.JustDown(secondary);
  }

  private _held(primary: Phaser.Input.Keyboard.Key, secondary: Phaser.Input.Keyboard.Key): boolean {
    return primary.isDown || secondary.isDown;
  }
}
