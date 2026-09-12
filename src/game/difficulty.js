import { DIFFICULTY, LEVEL_THRESHOLDS, OBSTACLE_TYPES } from './config.js';

// Чистые функции сложности. Не зависят от DOM и ассетов, поэтому легко тестируются.

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

/** Доля прогресса сложности от 0 до 1 для текущего счёта. */
function difficultyProgress(score) {
  return clamp01(score / DIFFICULTY.maxScore);
}

/** Скорость движения мира в px/s. */
function speedForScore(score) {
  const capped = Math.min(Math.max(score, 0), DIFFICULTY.maxScore);
  return DIFFICULTY.baseSpeed + capped * DIFFICULTY.speedPerPoint;
}

/** Диапазон интервала между препятствиями в секундах пути. */
function gapTimeRangeForScore(score) {
  const t = difficultyProgress(score);
  const { start, end } = DIFFICULTY.gapTime;
  return {
    min: start.min + (end.min - start.min) * t,
    max: start.max + (end.max - start.max) * t,
  };
}

/** Индекс визуального уровня (фона) для счёта. */
function levelIndexForScore(score, thresholds = LEVEL_THRESHOLDS) {
  let index = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (score >= thresholds[i]) index = i;
  }
  return index;
}

/** Типы препятствий, доступные при данном счёте. */
function availableObstacleTypes(score, types = OBSTACLE_TYPES) {
  return Object.entries(types)
    .filter(([, type]) => score >= type.minScore)
    .map(([name, type]) => ({ name, ...type }));
}

/**
 * Выбирает случайный тип препятствия с учётом весов.
 * @param {number} score
 * @param {() => number} random - источник случайности, подменяется в тестах.
 */
function pickObstacleType(score, random = Math.random, types = OBSTACLE_TYPES) {
  const available = availableObstacleTypes(score, types);
  const totalWeight = available.reduce((sum, type) => sum + type.weight, 0);
  let roll = random() * totalWeight;
  for (const type of available) {
    roll -= type.weight;
    if (roll < 0) return type;
  }
  return available[available.length - 1];
}

export {
  difficultyProgress,
  speedForScore,
  gapTimeRangeForScore,
  levelIndexForScore,
  availableObstacleTypes,
  pickObstacleType,
};
