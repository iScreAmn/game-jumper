import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS, evaluateAchievements } from '../src/game/achievements.js';

const baseStats = {
  score: 0,
  levelIndex: 0,
  ducked: 0,
  cutJumps: 0,
  charactersPlayed: [],
  mode: 'endless',
  finished: false,
};

describe('achievements', () => {
  it('has unique ids', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('returns nothing for a fresh run', () => {
    expect(evaluateAchievements(baseStats, [])).toEqual([]);
  });

  it('unlocks score milestones', () => {
    const ids = evaluateAchievements({ ...baseStats, score: 25 }, []).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['score_10', 'score_25']));
    expect(ids).not.toContain('score_50');
  });

  it('skips already unlocked achievements', () => {
    const ids = evaluateAchievements({ ...baseStats, score: 25 }, ['score_10']).map((a) => a.id);
    expect(ids).not.toContain('score_10');
    expect(ids).toContain('score_25');
  });

  it('full send requires no cut jumps', () => {
    expect(evaluateAchievements({ ...baseStats, score: 15 }, []).map((a) => a.id)).toContain('full_send');
    expect(evaluateAchievements({ ...baseStats, score: 15, cutJumps: 1 }, []).map((a) => a.id)).not.toContain('full_send');
  });

  it('first run unlocks only when finished', () => {
    expect(evaluateAchievements(baseStats, []).map((a) => a.id)).not.toContain('first_run');
    expect(evaluateAchievements({ ...baseStats, finished: true }, []).map((a) => a.id)).toContain('first_run');
  });

  it('daily and squad achievements', () => {
    const stats = { ...baseStats, mode: 'daily', charactersPlayed: [0, 1, 2] };
    const ids = evaluateAchievements(stats, []).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['daily', 'squad']));
  });
});
