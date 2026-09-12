import { describe, it, expect } from 'vitest';
import { Effects } from '../src/game/effects.js';
import { ParticleSystem } from '../src/game/particles.js';
import { Parallax } from '../src/game/parallax.js';
import { CANVAS } from '../src/game/config.js';

describe('Effects', () => {
  it('hit-stop freezes for its duration and then releases', () => {
    const effects = new Effects();
    effects.hitStop(0.1);
    expect(effects.frozen).toBe(true);
    effects.update(0.05);
    expect(effects.frozen).toBe(true);
    effects.update(0.06);
    expect(effects.frozen).toBe(false);
  });

  it('shake decays to zero offset', () => {
    const effects = new Effects();
    effects.shake(10, 0.3);
    effects.update(0.01);
    const during = effects.shakeOffset;
    expect(Math.abs(during.x) + Math.abs(during.y)).toBeGreaterThan(0);
    effects.update(0.5);
    expect(effects.shakeOffset).toEqual({ x: 0, y: 0 });
  });

  it('respects reduced motion by skipping shake', () => {
    const effects = new Effects({ reducedMotion: true });
    effects.shake(10, 0.3);
    effects.update(0.01);
    expect(effects.shakeOffset).toEqual({ x: 0, y: 0 });
  });

  it('floating texts and toasts expire', () => {
    const effects = new Effects();
    effects.floatText('+1', 10, 10);
    effects.toast('Title', 'Sub');
    expect(effects.floatingTexts).toHaveLength(1);
    expect(effects.toasts).toHaveLength(1);
    effects.update(5);
    expect(effects.floatingTexts).toHaveLength(0);
    expect(effects.toasts).toHaveLength(0);
  });
});

describe('ParticleSystem', () => {
  it('emits, moves and expires particles', () => {
    const particles = new ParticleSystem(() => 0.5);
    particles.explosion(100, 100);
    expect(particles.particles.length).toBe(60);
    const before = particles.particles[0].x;
    particles.update(0.1, 0);
    expect(particles.particles[0].x).not.toBe(before);
    particles.update(5, 0);
    expect(particles.particles).toHaveLength(0);
  });

  it('does not emit when disabled', () => {
    const particles = new ParticleSystem();
    particles.enabled = false;
    particles.landingDust(0, 0);
    expect(particles.particles).toHaveLength(0);
  });

  it('caps the total number of particles', () => {
    const particles = new ParticleSystem();
    for (let i = 0; i < 20; i++) particles.explosion(0, 0);
    expect(particles.particles.length).toBeLessThanOrEqual(400);
  });
});

describe('Parallax', () => {
  it('layers scroll at different speeds and wrap around', () => {
    const parallax = new Parallax(1);
    parallax.update(1, 100);
    const [stars, embers, rocks] = parallax.layers;
    expect(stars.offset).toBeLessThan(embers.offset);
    expect(embers.offset).toBeLessThan(rocks.offset);

    parallax.update(100, 100);
    for (const layer of parallax.layers) {
      expect(layer.offset).toBeGreaterThanOrEqual(0);
      expect(layer.offset).toBeLessThan(CANVAS.width);
    }
  });

  it('is deterministic for the same seed', () => {
    const a = new Parallax(5);
    const b = new Parallax(5);
    expect(a.layers[0].items).toEqual(b.layers[0].items);
  });
});
