import { describe, it, expect } from 'vitest';
import { todayKey, dailyRandom } from '../src/game/daily.js';
import { mulberry32, hashString } from '../src/game/random.js';

describe('random', () => {
  it('mulberry32 is deterministic and in [0, 1)', () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    for (let i = 0; i < 100; i++) {
      const value = a();
      expect(value).toBe(b());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('different seeds give different sequences', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const seqA = Array.from({ length: 5 }, a);
    const seqB = Array.from({ length: 5 }, b);
    expect(seqA).not.toEqual(seqB);
  });

  it('hashString is stable and differs for different input', () => {
    expect(hashString('2026-09-12')).toBe(hashString('2026-09-12'));
    expect(hashString('2026-09-12')).not.toBe(hashString('2026-09-13'));
  });
});

describe('daily', () => {
  it('formats the day key in local time with zero padding', () => {
    expect(todayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(todayKey(new Date(2026, 11, 25))).toBe('2026-12-25');
  });

  it('same day gives the same random sequence', () => {
    const a = dailyRandom('2026-09-12');
    const b = dailyRandom('2026-09-12');
    expect(Array.from({ length: 10 }, a)).toEqual(Array.from({ length: 10 }, b));
  });

  it('different days give different sequences', () => {
    const a = dailyRandom('2026-09-12');
    const b = dailyRandom('2026-09-13');
    expect(Array.from({ length: 10 }, a)).not.toEqual(Array.from({ length: 10 }, b));
  });
});
