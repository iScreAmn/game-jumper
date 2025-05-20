// src/game/levels.js

// Импорт фоновых изображений для уровней
import level1BgPath from '../assets/images/levels/level-1.webp';
import level2BgPath from '../assets/images/levels/level-2.webp';
import level3BgPath from '../assets/images/levels/level-3.webp';

// Градиенты для фона body на разных уровнях
const LEVEL_GRADIENTS = [
  "linear-gradient(45deg, rgba(2, 0, 36, 1) 0%, rgba(170, 0, 63, 1) 52%, rgba(18, 33, 71, 1) 100%)", // Уровень 1
  "linear-gradient(45deg, rgba(19,0,56,1) 0%, rgba(197,9,235,1) 52%, rgba(124,91,237,1) 100%)",   // Уровень 2
  "linear-gradient(45deg, rgba(84,176,97,1) 0%, rgba(93,210,240,1) 46%, rgba(51,126,169,1) 100%)" // Уровень 3
];

// Настройки для каждого уровня
const LEVEL_CONFIGS = [
  { // Уровень 1 (индекс 0)
    backgroundImage: level1BgPath,
    bodyGradient: LEVEL_GRADIENTS[0],
    gameSpeed: 4,
    obstacleInterval: 2000, // мс, начальный интервал для генерации препятствий
    playerJumpPower: -10.5,
    scoreToNextLevel: 5
  },
  { // Уровень 2 (индекс 1)
    backgroundImage: level2BgPath,
    bodyGradient: LEVEL_GRADIENTS[1],
    gameSpeed: 4.1,
    obstacleInterval: 1200,
    playerJumpPower: -10.5, // Можно изменить, если нужно
    scoreToNextLevel: 10
  },
  { // Уровень 3 (индекс 2)
    backgroundImage: level3BgPath,
    bodyGradient: LEVEL_GRADIENTS[2],
    gameSpeed: 5,
    obstacleInterval: 1000,
    playerJumpPower: -10.5, // Можно изменить, если нужно
    scoreToNextLevel: Infinity // Последний уровень
  }
];

let currentLevelIndex = 0;

/**
 * Применяет настройки текущего уровня к игре.
 * @param {HTMLCanvasElement} canvas - Игровой холст.
 */
function applyLevelSettings(canvas) {
  const config = LEVEL_CONFIGS[currentLevelIndex];
  canvas.style.backgroundImage = `url('${config.backgroundImage}')`;
  document.body.style.background = config.bodyGradient;
}

/**
 * Возвращает конфигурацию текущего уровня.
 * @returns {object} Конфигурация текущего уровня.
 */
function getCurrentLevelConfig() {
  return LEVEL_CONFIGS[currentLevelIndex];
}

/**
 * Проверяет, нужно ли переходить на следующий уровень, и обновляет его.
 * @param {number} score - Текущий счет игрока.
 * @param {HTMLCanvasElement} canvas - Игровой холст.
 * @param {object} player - Объект игрока для обновления силы прыжка.
 * @returns {boolean} True, если уровень был изменен, иначе false.
 */
function updateLevel(score, canvas, player) {
  const currentConfig = getCurrentLevelConfig();
  if (score >= currentConfig.scoreToNextLevel && currentLevelIndex < LEVEL_CONFIGS.length - 1) {
    currentLevelIndex++;
    applyLevelSettings(canvas);
    if (player) { // Обновляем силу прыжка игрока, если она меняется на новом уровне
        player.jumpPower = getCurrentLevelConfig().playerJumpPower;
    }
    return true; // Уровень изменился
  }
  return false; // Уровень не изменился
}

/**
 * Сбрасывает уровень на начальный.
 * @param {HTMLCanvasElement} canvas - Игровой холст.
 */
function resetLevels(canvas) {
  currentLevelIndex = 0;
  applyLevelSettings(canvas);
}

export { LEVEL_CONFIGS, getCurrentLevelConfig, updateLevel, resetLevels, applyLevelSettings };
