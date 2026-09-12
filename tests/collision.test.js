import { describe, it, expect } from 'vitest';
import { checkCollision, getHitbox, rectsIntersect } from '../src/game/collision.js';

describe('rectsIntersect', () => {
  it('detects overlapping rectangles', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    expect(rectsIntersect(a, b)).toBe(true);
  });

  it('treats touching edges as no collision', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 10, y: 0, width: 10, height: 10 };
    expect(rectsIntersect(a, b)).toBe(false);
  });

  it('returns false for separated rectangles', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 50, y: 50, width: 10, height: 10 };
    expect(rectsIntersect(a, b)).toBe(false);
  });
});

describe('getHitbox', () => {
  it('shrinks the rectangle by insets', () => {
    const rect = { x: 10, y: 20, width: 40, height: 60 };
    const inset = { left: 5, right: 5, top: 10, bottom: 0 };
    expect(getHitbox(rect, inset)).toEqual({ x: 15, y: 30, width: 30, height: 50 });
  });

  it('never returns negative size', () => {
    const rect = { x: 0, y: 0, width: 4, height: 4 };
    const inset = { left: 5, right: 5, top: 5, bottom: 5 };
    const box = getHitbox(rect, inset);
    expect(box.width).toBe(0);
    expect(box.height).toBe(0);
  });
});

describe('checkCollision', () => {
  it('ignores overlap that happens only in transparent margins', () => {
    const player = { x: 0, y: 0, width: 40, height: 40, hitbox: { left: 10, right: 10, top: 0, bottom: 0 } };
    const obstacle = { x: 35, y: 0, width: 40, height: 40, hitbox: { left: 10, right: 10, top: 0, bottom: 0 } };
    // Спрайты пересекаются на 5px, но хитбоксы (10..30 и 45..65) нет.
    expect(checkCollision(player, obstacle)).toBe(false);
  });

  it('detects collision of hitboxes', () => {
    const player = { x: 0, y: 0, width: 40, height: 40, hitbox: { left: 10, right: 10, top: 0, bottom: 0 } };
    const obstacle = { x: 15, y: 0, width: 40, height: 40, hitbox: { left: 10, right: 10, top: 0, bottom: 0 } };
    expect(checkCollision(player, obstacle)).toBe(true);
  });

  it('works without hitbox insets', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 9, y: 9, width: 10, height: 10 };
    expect(checkCollision(a, b)).toBe(true);
  });
});
