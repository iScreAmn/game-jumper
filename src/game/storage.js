import { RECENT_GAMES_LIMIT, STORAGE_KEY } from './config.js';

// Сохранение в localStorage: рекорд, последние игры, настройки, достижения.
// Все обращения обёрнуты в try/catch, так как хранилище может быть недоступно.

const DEFAULT_SAVE = {
  best: 0,
  recent: [],
  muted: false,
  characterIndex: 0,
  daily: { date: '', best: 0 },
  achievements: [],
  charactersPlayed: [],
};

function getStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function numberList(value) {
  return Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : [];
}

function stringList(value) {
  return Array.isArray(value) ? value.filter((v) => typeof v === 'string') : [];
}

function normalize(parsed) {
  const daily = parsed.daily && typeof parsed.daily === 'object' ? parsed.daily : {};
  return {
    best: Number(parsed.best) || 0,
    recent: numberList(parsed.recent),
    muted: Boolean(parsed.muted),
    characterIndex: Number(parsed.characterIndex) || 0,
    daily: { date: typeof daily.date === 'string' ? daily.date : '', best: Number(daily.best) || 0 },
    achievements: stringList(parsed.achievements),
    charactersPlayed: numberList(parsed.charactersPlayed),
  };
}

function clone(save) {
  return { ...save, daily: { ...save.daily }, recent: [...save.recent], achievements: [...save.achievements], charactersPlayed: [...save.charactersPlayed] };
}

function loadSave() {
  const storage = getStorage();
  if (!storage) return clone(DEFAULT_SAVE);
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return clone(DEFAULT_SAVE);
    return normalize(JSON.parse(raw));
  } catch {
    return clone(DEFAULT_SAVE);
  }
}

function writeSave(save) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // Хранилище переполнено или запрещено. Игра продолжает работать без сохранения.
  }
}

function updateSave(patch) {
  const next = { ...loadSave(), ...patch };
  writeSave(next);
  return next;
}

/**
 * Записывает результат игры.
 * @param {number} score
 * @param {object} [opts]
 * @param {'endless'|'daily'} [opts.mode]
 * @param {string} [opts.dayKey] - ключ дня для режима daily
 * @returns {{save: object, isNewBest: boolean, isNewDailyBest: boolean}}
 */
function recordGame(score, { mode = 'endless', dayKey = '' } = {}) {
  const save = loadSave();
  const isNewBest = score > save.best;
  const recent = [...save.recent, score].slice(-RECENT_GAMES_LIMIT);

  let daily = save.daily;
  let isNewDailyBest = false;
  if (mode === 'daily') {
    const sameDay = save.daily.date === dayKey;
    const previous = sameDay ? save.daily.best : 0;
    isNewDailyBest = score > previous;
    daily = { date: dayKey, best: Math.max(previous, score) };
  }

  const next = { ...save, best: Math.max(save.best, score), recent, daily };
  writeSave(next);
  return { save: next, isNewBest, isNewDailyBest };
}

/** Отмечает персонажа сыгранным. Возвращает обновлённое сохранение. */
function markCharacterPlayed(index) {
  const save = loadSave();
  if (save.charactersPlayed.includes(index)) return save;
  return updateSave({ charactersPlayed: [...save.charactersPlayed, index] });
}

/** Добавляет открытые достижения. Возвращает обновлённое сохранение. */
function unlockAchievements(ids) {
  const save = loadSave();
  const merged = [...new Set([...save.achievements, ...ids])];
  if (merged.length === save.achievements.length) return save;
  return updateSave({ achievements: merged });
}

export { loadSave, updateSave, recordGame, markCharacterPlayed, unlockAchievements, DEFAULT_SAVE };
