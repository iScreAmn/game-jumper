// Единый источник всех игровых констант.
// Физика задана в пикселях в секунду, чтобы не зависеть от частоты кадров.

export const CANVAS = {
  width: 500,
  height: 500,
};

// Линия земли: нижняя граница игрока и препятствий.
export const GROUND_Y = 350;

export const PHYSICS = {
  gravity: 1800, // px/s²
  jumpVelocity: -750, // px/s, полная сила прыжка при удержании
  jumpCutMultiplier: 0.45, // во сколько раз урезать скорость при раннем отпускании
  maxDeltaTime: 1 / 30, // с, защита от телепорта после паузы вкладки
};

export const PLAYER = {
  x: 50,
  width: 45,
  height: 70,
  // Отступы хитбокса внутрь спрайта: у картинок есть прозрачные поля.
  hitbox: { left: 8, right: 8, top: 6, bottom: 0 },
};

// Типы препятствий. count > 1 означает несколько спрайтов подряд в одном хитбоксе.
export const OBSTACLE_TYPES = {
  small: { width: 32, height: 50, count: 1, minScore: 0, weight: 4 },
  wide: { width: 55, height: 50, count: 1, minScore: 0, weight: 3 },
  tall: { width: 48, height: 74, count: 1, minScore: 8, weight: 2 },
  double: { width: 32, height: 50, count: 2, gap: 4, minScore: 15, weight: 2 },
};

export const OBSTACLE_HITBOX = { left: 5, right: 5, top: 8, bottom: 0 };

export const DIFFICULTY = {
  baseSpeed: 240, // px/s, соответствует старым 4 px/кадр при 60 fps
  speedPerPoint: 4, // прибавка скорости за каждое очко
  maxScore: 60, // после этого счёта сложность не растёт
  // Интервал между препятствиями в секундах пути. Сжимается с ростом сложности.
  gapTime: {
    start: { min: 1.25, max: 2.0 },
    end: { min: 0.95, max: 1.45 },
  },
};

// Счёт, при котором включается фон соответствующего уровня.
export const LEVEL_THRESHOLDS = [0, 10, 25, 45];

export const STORAGE_KEY = 'flameJumper.save';
export const RECENT_GAMES_LIMIT = 10;

// Задержка после проигрыша, пока ввод игнорируется. Защита от случайного рестарта.
export const GAME_OVER_INPUT_DELAY = 0.6;
