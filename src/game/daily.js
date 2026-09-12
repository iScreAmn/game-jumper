import { hashString, mulberry32 } from './random.js';

// Ежедневное испытание: сид генератора препятствий привязан к дате,
// поэтому все игроки в один день проходят одну и ту же полосу.

/** Ключ дня в локальном времени в формате YYYY-MM-DD. */
function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Источник случайности для дня. Одинаковый ключ даёт одинаковую последовательность. */
function dailyRandom(dayKey) {
  return mulberry32(hashString(`flame-jumper:${dayKey}`));
}

export { todayKey, dailyRandom };
