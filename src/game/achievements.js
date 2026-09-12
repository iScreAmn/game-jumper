import { LEVEL_THRESHOLDS } from './config.js';

// Достижения проверяются по снимку статистики забега и сохранения.
// Каждая проверка чистая: получает stats и возвращает boolean.

/**
 * @typedef {object} RunStats
 * @property {number} score
 * @property {number} levelIndex
 * @property {number} ducked - метеоров, под которыми игрок пригнулся за этот забег
 * @property {number} cutJumps - урезанных прыжков за этот забег
 * @property {number[]} charactersPlayed - индексы персонажей, которыми играли когда-либо
 * @property {'endless'|'daily'} mode
 * @property {boolean} finished - забег завершён
 */

const ACHIEVEMENTS = [
  { id: 'first_run', title: 'First steps', description: 'Finish a run', check: (s) => s.finished },
  { id: 'score_10', title: 'Warmed up', description: 'Score 10 points', check: (s) => s.score >= 10 },
  { id: 'score_25', title: 'On fire', description: 'Score 25 points', check: (s) => s.score >= 25 },
  { id: 'score_50', title: 'Fireproof', description: 'Score 50 points', check: (s) => s.score >= 50 },
  {
    id: 'level_4',
    title: 'Neon nights',
    description: 'Reach the fourth level',
    check: (s) => s.levelIndex >= LEVEL_THRESHOLDS.length - 1,
  },
  { id: 'limbo', title: 'Limbo', description: 'Duck under 5 meteors in one run', check: (s) => s.ducked >= 5 },
  {
    id: 'full_send',
    title: 'Full send',
    description: 'Score 15 using only full jumps',
    check: (s) => s.score >= 15 && s.cutJumps === 0,
  },
  {
    id: 'squad',
    title: 'Squad goals',
    description: 'Play as every character',
    check: (s) => s.charactersPlayed.length >= 3,
  },
  { id: 'daily', title: 'Daily driver', description: 'Play a daily challenge', check: (s) => s.mode === 'daily' },
];

/**
 * Возвращает достижения, которые выполнены, но ещё не открыты.
 * @param {RunStats} stats
 * @param {string[]} unlockedIds
 */
function evaluateAchievements(stats, unlockedIds) {
  const unlocked = new Set(unlockedIds);
  return ACHIEVEMENTS.filter((a) => !unlocked.has(a.id) && a.check(stats));
}

export { ACHIEVEMENTS, evaluateAchievements };
