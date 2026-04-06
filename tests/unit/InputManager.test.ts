import { beforeEach, describe, expect, it, vi } from 'vitest';

const keyFactory = () => ({ isDown: false, justDown: false });
const pointerHandlers = new Map<string, (pointer: { x: number; y: number }) => void>();
const keys = new Map<number, ReturnType<typeof keyFactory>>();

vi.mock('phaser', () => {
  const KeyCodes = {
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    W: 87,
    A: 65,
    S: 83,
    D: 68,
  };

  return {
    default: {
      Input: {
        Keyboard: {
          KeyCodes,
          JustDown: (key: { justDown: boolean }) => {
            const value = key.justDown;
            key.justDown = false;
            return value;
          },
        },
      },
    },
  };
});

const scene = {
  input: {
    keyboard: {
      addKey(code: number) {
        if (!keys.has(code)) {
          keys.set(code, keyFactory());
        }
        return keys.get(code)!;
      },
    },
    on(event: string, handler: (pointer: { x: number; y: number }) => void) {
      pointerHandlers.set(event, handler);
    },
  },
};

const { InputManager } = await import('../../src/systems/InputManager');

function setJustDown(code: number): void {
  const key = keys.get(code);
  if (key) {
    key.justDown = true;
  }
}

function setHeld(code: number, held: boolean): void {
  const key = keys.get(code);
  if (key) {
    key.isDown = held;
  }
}

describe('InputManager', () => {
  let input: InstanceType<typeof InputManager>;

  beforeEach(() => {
    keys.clear();
    pointerHandlers.clear();
    input = new (InputManager as any)(scene);
  });

  it('buffers arrow-key presses', () => {
    setJustDown(39);
    expect(input.poll()).toBe('RIGHT');
    expect(input.buffered).toBe('RIGHT');
  });

  it('supports WASD as equivalent directional input', () => {
    setJustDown(87);
    expect(input.poll()).toBe('UP');
  });

  it('falls back to held keys when no buffered press exists', () => {
    setHeld(37, true);
    expect(input.poll()).toBe('LEFT');
  });

  it('promotes the buffered direction to current on consumeBuffer', () => {
    setJustDown(40);
    input.poll();
    input.consumeBuffer();
    expect(input.current).toBe('DOWN');
    expect(input.buffered).toBe('NONE');
  });

  it('keeps a buffered direction when requested', () => {
    setJustDown(38);
    input.poll();
    input.keepBuffer();
    expect(input.buffered).toBe('UP');
  });

  it('converts a swipe gesture into a buffered direction', () => {
    pointerHandlers.get('pointerdown')?.({ x: 10, y: 10 });
    pointerHandlers.get('pointerup')?.({ x: 40, y: 14 });
    expect(input.poll()).toBe('RIGHT');
  });

  it('ignores short swipes below the threshold', () => {
    pointerHandlers.get('pointerdown')?.({ x: 10, y: 10 });
    pointerHandlers.get('pointerup')?.({ x: 20, y: 14 });
    expect(input.poll()).toBe('NONE');
  });
});
