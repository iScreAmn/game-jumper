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
  fastFallVelocity: 900, // px/s, ускоренное падение при нажатии «вниз» в воздухе
  maxDeltaTime: 1 / 30, // с, защита от телепорта после паузы вкладки
};

export const PLAYER = {
  x: 50,
  width: 45,
  height: 70,
  duckHeight: 38, // высота в приседе, под ней должны пролетать низкие метеоры
  duckWidth: 56,
  // Отступы хитбокса внутрь спрайта: у картинок есть прозрачные поля.
  hitbox: { left: 8, right: 8, top: 6, bottom: 0 },
  duckHitbox: { left: 6, right: 6, top: 4, bottom: 0 },
};

// Типы препятствий. count > 1 означает несколько спрайтов подряд в одном хитбоксе.
// altitude задаёт высоту нижнего края над землёй: 0 для наземных, больше для летающих.
export const OBSTACLE_TYPES = {
  small: { width: 32, height: 50, count: 1, altitude: 0, minScore: 0, weight: 4 },
  wide: { width: 55, height: 50, count: 1, altitude: 0, minScore: 0, weight: 3 },
  tall: { width: 48, height: 74, count: 1, altitude: 0, minScore: 8, weight: 2 },
  double: { width: 32, height: 50, count: 2, gap: 4, altitude: 0, minScore: 15, weight: 2 },
  // Низкий метеор: стоящего игрока задевает, в приседе пролетает над головой.
  flyLow: { width: 40, height: 40, count: 1, altitude: 44, minScore: 12, weight: 3, flying: true },
  // Высокий метеор: стоящему не мешает, а вот прыгать под ним нельзя.
  flyHigh: { width: 40, height: 40, count: 1, altitude: 80, minScore: 20, weight: 2, flying: true },
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

export const EFFECTS = {
  hitStop: 0.09, // с, заморозка кадра при столкновении
  deathShake: { intensity: 9, duration: 0.35 },
  landShake: { intensity: 2, duration: 0.08 },
  levelFlash: 0.6, // с, длительность вспышки при смене уровня
};

export const STORAGE_KEY = 'flameJumper.save';
export const RECENT_GAMES_LIMIT = 10;

// Задержка после проигрыша, пока ввод игнорируется. Защита от случайного рестарта.
export const GAME_OVER_INPUT_DELAY = 0.6;
