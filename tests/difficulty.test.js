import { describe, it, expect } from 'vitest';
import {
  speedForScore,
  gapTimeRangeForScore,
  levelIndexForScore,
  availableObstacleTypes,
  pickObstacleType,
} from '../src/game/difficulty.js';
import { DIFFICULTY, LEVEL_THRESHOLDS, OBSTACLE_TYPES, PHYSICS, PLAYER } from '../src/game/config.js';

describe('speedForScore', () => {
  it('starts at base speed', () => {
    expect(speedForScore(0)).toBe(DIFFICULTY.baseSpeed);
  });

  it('grows linearly with score', () => {
    expect(speedForScore(10)).toBe(DIFFICULTY.baseSpeed + 10 * DIFFICULTY.speedPerPoint);
  });

  it('caps at max score', () => {
    expect(speedForScore(DIFFICULTY.maxScore * 5)).toBe(speedForScore(DIFFICULTY.maxScore));
  });

  it('never goes below base for negative input', () => {
    expect(speedForScore(-10)).toBe(DIFFICULTY.baseSpeed);
  });
});

describe('gapTimeRangeForScore', () => {
  it('starts wide and narrows toward the end range', () => {
    expect(gapTimeRangeForScore(0)).toEqual(DIFFICULTY.gapTime.start);
    expect(gapTimeRangeForScore(DIFFICULTY.maxScore)).toEqual(DIFFICULTY.gapTime.end);
  });

  it('keeps min below max at every score', () => {
    for (let score = 0; score <= DIFFICULTY.maxScore; score++) {
      const range = gapTimeRangeForScore(score);
      expect(range.min).toBeLessThan(range.max);
    }
  });

  it('leaves enough time for a full jump even at the hardest setting', () => {
    // Полная дуга прыжка: вверх и вниз с той же скоростью.
    const fullJumpTime = (2 * Math.abs(PHYSICS.jumpVelocity)) / PHYSICS.gravity;
    const hardest = gapTimeRangeForScore(DIFFICULTY.maxScore);
    expect(hardest.min).toBeGreaterThan(fullJumpTime);
  });
});

describe('levelIndexForScore', () => {
  it('returns 0 before the first threshold is passed', () => {
    expect(levelIndexForScore(0)).toBe(0);
    expect(levelIndexForScore(LEVEL_THRESHOLDS[1] - 1)).toBe(0);
  });

  it('advances exactly at each threshold', () => {
    LEVEL_THRESHOLDS.forEach((threshold, index) => {
      expect(levelIndexForScore(threshold)).toBe(index);
    });
  });

  it('stays on the last level for huge scores', () => {
    expect(levelIndexForScore(1_000_000)).toBe(LEVEL_THRESHOLDS.length - 1);
  });

  it('accepts custom thresholds', () => {
    expect(levelIndexForScore(7, [0, 5, 10])).toBe(1);
  });
});

describe('obstacle types', () => {
  it('unlocks types by score', () => {
    const early = availableObstacleTypes(0).map((t) => t.name);
    expect(early).toEqual(['small', 'wide']);

    const late = availableObstacleTypes(100).map((t) => t.name);
    expect(late).toEqual(Object.keys(OBSTACLE_TYPES));
  });

  it('picks the first type for a zero roll and the last for a roll near one', () => {
    expect(pickObstacleType(100, () => 0).name).toBe('small');
    expect(pickObstacleType(100, () => 0.999999).name).toBe('double');
  });

  it('every type is lower than the maximum jump height', () => {
    const maxJumpHeight = PHYSICS.jumpVelocity ** 2 / (2 * PHYSICS.gravity);
    for (const type of Object.values(OBSTACLE_TYPES)) {
      expect(type.height).toBeLessThan(maxJumpHeight - PLAYER.hitbox.top);
    }
  });
});
