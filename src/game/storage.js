import { RECENT_GAMES_LIMIT, STORAGE_KEY } from './config.js';

// Сохранение в localStorage: рекорд, последние игры, настройки.
// Все обращения обёрнуты в try/catch, так как хранилище может быть недоступно.

const DEFAULT_SAVE = {
  best: 0,
  recent: [],
  muted: false,
  characterIndex: 0,
};

function getStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function loadSave() {
  const storage = getStorage();
  if (!storage) return { ...DEFAULT_SAVE };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    const parsed = JSON.parse(raw);
    return {
      best: Number(parsed.best) || 0,
      recent: Array.isArray(parsed.recent) ? parsed.recent.map(Number).filter(Number.isFinite) : [],
      muted: Boolean(parsed.muted),
      characterIndex: Number(parsed.characterIndex) || 0,
    };
  } catch {
    return { ...DEFAULT_SAVE };
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

/** Записывает результат игры. Возвращает обновлённое сохранение и флаг нового рекорда. */
function recordGame(score) {
  const save = loadSave();
  const isNewBest = score > save.best;
  const recent = [...save.recent, score].slice(-RECENT_GAMES_LIMIT);
  const next = { ...save, best: Math.max(save.best, score), recent };
  writeSave(next);
  return { save: next, isNewBest };
}

export { loadSave, updateSave, recordGame, DEFAULT_SAVE };
