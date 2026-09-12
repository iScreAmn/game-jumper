import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  loadSave,
  updateSave,
  recordGame,
  markCharacterPlayed,
  unlockAchievements,
  DEFAULT_SAVE,
} from '../src/game/storage.js';
import { RECENT_GAMES_LIMIT, STORAGE_KEY } from '../src/game/config.js';

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

describe('storage', () => {
  beforeEach(() => {
    globalThis.localStorage = fakeStorage();
  });

  afterEach(() => {
    delete globalThis.localStorage;
  });

  it('returns defaults when nothing is saved', () => {
    expect(loadSave()).toEqual(DEFAULT_SAVE);
  });

  it('returns defaults when localStorage is unavailable', () => {
    delete globalThis.localStorage;
    expect(loadSave()).toEqual(DEFAULT_SAVE);
    expect(() => updateSave({ muted: true })).not.toThrow();
  });

  it('survives corrupted data', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadSave()).toEqual(DEFAULT_SAVE);
  });

  it('upgrades an old save without the new fields', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify({ best: 7, recent: [7], muted: true, characterIndex: 2 }));
    const save = loadSave();
    expect(save.best).toBe(7);
    expect(save.daily).toEqual({ date: '', best: 0 });
    expect(save.achievements).toEqual([]);
    expect(save.charactersPlayed).toEqual([]);
  });

  it('records best score and recent runs', () => {
    expect(recordGame(5).isNewBest).toBe(true);
    expect(recordGame(3).isNewBest).toBe(false);
    const { save, isNewBest } = recordGame(9);
    expect(isNewBest).toBe(true);
    expect(save.best).toBe(9);
    expect(save.recent).toEqual([5, 3, 9]);
  });

  it('keeps only the last N runs', () => {
    for (let i = 0; i < RECENT_GAMES_LIMIT + 5; i++) recordGame(i);
    const save = loadSave();
    expect(save.recent).toHaveLength(RECENT_GAMES_LIMIT);
    expect(save.recent.at(-1)).toBe(RECENT_GAMES_LIMIT + 4);
  });

  it('tracks daily best per day', () => {
    const first = recordGame(4, { mode: 'daily', dayKey: '2026-09-12' });
    expect(first.isNewDailyBest).toBe(true);
    expect(first.save.daily).toEqual({ date: '2026-09-12', best: 4 });

    const lower = recordGame(2, { mode: 'daily', dayKey: '2026-09-12' });
    expect(lower.isNewDailyBest).toBe(false);
    expect(lower.save.daily.best).toBe(4);

    const nextDay = recordGame(1, { mode: 'daily', dayKey: '2026-09-13' });
    expect(nextDay.isNewDailyBest).toBe(true);
    expect(nextDay.save.daily).toEqual({ date: '2026-09-13', best: 1 });
  });

  it('endless runs do not touch the daily record', () => {
    recordGame(4, { mode: 'daily', dayKey: '2026-09-12' });
    const { save } = recordGame(50);
    expect(save.daily).toEqual({ date: '2026-09-12', best: 4 });
    expect(save.best).toBe(50);
  });

  it('merges settings without touching scores', () => {
    recordGame(7);
    updateSave({ muted: true, characterIndex: 2 });
    const save = loadSave();
    expect(save.best).toBe(7);
    expect(save.muted).toBe(true);
    expect(save.characterIndex).toBe(2);
  });

  it('marks characters played without duplicates', () => {
    markCharacterPlayed(1);
    markCharacterPlayed(1);
    markCharacterPlayed(0);
    expect(loadSave().charactersPlayed).toEqual([1, 0]);
  });

  it('unlocks achievements idempotently', () => {
    unlockAchievements(['a', 'b']);
    unlockAchievements(['b', 'c']);
    expect(loadSave().achievements).toEqual(['a', 'b', 'c']);
  });
});
