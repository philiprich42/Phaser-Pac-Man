import { describe, it, expect, beforeEach } from 'vitest';
import { GhostAI } from '../../src/systems/GhostAI';

describe('GhostAI', () => {
  let ai: GhostAI;

  beforeEach(() => {
    ai = new GhostAI(1);
  });

  it('starts in scatter mode', () => {
    expect(ai.mode).toBe('scatter');
  });

  it('transitions to chase after scatter duration elapses (level 1: 7s)', () => {
    ai.update(7.1); // just over 7 seconds
    expect(ai.mode).toBe('chase');
  });

  it('transitions back to scatter after first chase phase (20s)', () => {
    ai.update(7.1);  // scatter → chase
    ai.update(20.1); // chase → scatter
    expect(ai.mode).toBe('scatter');
  });

  it('enters frightened mode on enterFrightened()', () => {
    ai.enterFrightened();
    expect(ai.mode).toBe('frightened');
  });

  it('restores previous mode after frightened duration expires (level 1: 6s)', () => {
    ai.enterFrightened();
    ai.update(6.1);
    expect(ai.mode).toBe('scatter');
  });

  it('enters frightened from chase and restores chase', () => {
    ai.update(7.1); // → chase
    ai.enterFrightened();
    expect(ai.mode).toBe('frightened');
    ai.update(6.1); // frightened expires
    expect(ai.mode).toBe('chase');
  });

  it('isFlashing is true in the last 2 seconds of frightened', () => {
    ai.enterFrightened(); // duration 6s
    ai.update(4.1); // 4.1s elapsed → 1.9s remaining → flashing
    expect(ai.isFlashing).toBe(true);
  });

  it('isFlashing is false early in frightened', () => {
    ai.enterFrightened();
    ai.update(1);
    expect(ai.isFlashing).toBe(false);
  });

  it('enters eaten mode and stays there until enterHouse()', () => {
    ai.enterFrightened();
    ai.enterEaten();
    ai.update(10);
    expect(ai.mode).toBe('eaten');
    ai.enterHouse();
    expect(ai.mode).toBe('scatter');
  });

  it('resets to scatter on reset()', () => {
    ai.update(7.1); // → chase
    ai.reset();
    expect(ai.mode).toBe('scatter');
    expect(ai.state.phaseIndex).toBe(0);
  });

  it('mode is never frightened after reset()', () => {
    ai.enterFrightened();
    ai.reset();
    expect(ai.mode).toBe('scatter');
  });
});
