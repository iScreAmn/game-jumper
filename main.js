import { Player } from './src/game/player.js';
import { ObstacleManager } from './src/game/obstacles.js';
import { LevelBackground } from './src/game/levels.js';
import { Game } from './src/game/game.js';
import { AudioManager } from './src/game/audio.js';
import { ParticleSystem } from './src/game/particles.js';
import { Effects } from './src/game/effects.js';
import { Parallax } from './src/game/parallax.js';
import { todayKey, dailyRandom } from './src/game/daily.js';
import { loadSave, updateSave, recordGame, markCharacterPlayed, unlockAchievements } from './src/game/storage.js';
import { CANVAS, GAME_OVER_INPUT_DELAY, PHYSICS } from './src/game/config.js';
import {
  FONT,
  SELECT_LAYOUT,
  START_MENU,
  startMenuRowAt,
  characterRowAt,
  drawHud,
  drawStartScreen,
  drawCharacterSelectScreen,
  drawPauseScreen,
  drawGameOverScreen,
  drawStatsScreen,
  drawAchievementsScreen,
} from './src/ui/screens.js';

// --- Холст с учётом плотности пикселей ---

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = CANVAS.width * dpr;
  canvas.height = CANVAS.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

/** Переводит координаты события указателя в логические координаты холста. */
function pointerToCanvas(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * CANVAS.width,
    y: ((event.clientY - rect.top) / rect.height) * CANVAS.height,
  };
}

// --- Состояние приложения ---

const STATES = {
  START: 'START',
  SELECT: 'SELECT',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  STATS: 'STATS',
  ACHIEVEMENTS: 'ACHIEVEMENTS',
};

// Сколько секунд после смерти длятся эффекты, прежде чем появится экран проигрыша.
const GAME_OVER_SCREEN_DELAY = 0.45;

let state = STATES.START;
let save = loadSave();
let selectedIndex = save.characterIndex;
let menuIndex = 0;
let mode = 'endless';
let lastResult = { isNewBest: false, isNewDailyBest: false };
let elapsed = 0; // общее время для анимаций подсказок
let lastFrameTime = 0;

const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const audio = new AudioManager();
audio.setMuted(save.muted);

const player = new Player();
player.selectCharacter(selectedIndex);
const obstacles = new ObstacleManager();
const background = new LevelBackground();
const particles = new ParticleSystem();
particles.enabled = !reducedMotion;
const effects = new Effects({ reducedMotion });
const parallax = new Parallax();
const game = new Game({ player, obstacles, background, audio, particles, effects, parallax });

game.onAchievement = (achievement) => {
  save = unlockAchievements([achievement.id]);
  effects.toast(`★ ${achievement.title}`, achievement.description);
};

// --- Переходы ---

function startRun() {
  player.selectCharacter(selectedIndex);
  save = updateSave({ characterIndex: selectedIndex });
  save = markCharacterPlayed(selectedIndex);
  const random = mode === 'daily' ? dailyRandom(todayKey()) : Math.random;
  game.start({
    mode,
    random,
    unlockedIds: save.achievements,
    charactersPlayed: save.charactersPlayed,
  });
  state = STATES.PLAYING;
}

function finishRun() {
  const result = recordGame(game.score, { mode, dayKey: todayKey() });
  save = result.save;
  lastResult = { isNewBest: result.isNewBest, isNewDailyBest: result.isNewDailyBest };
  state = STATES.GAME_OVER;
}

function toggleMute() {
  const muted = audio.toggleMuted();
  save = updateSave({ muted });
}

function gameOverInputReady() {
  return game.timeSinceOver >= GAME_OVER_INPUT_DELAY;
}

function currentBest() {
  if (mode === 'daily') return save.daily.date === todayKey() ? save.daily.best : 0;
  return save.best;
}

// --- Универсальное действие: Enter, Space или тап ---

function primaryAction(pointer = null) {
  switch (state) {
    case STATES.START: {
      if (pointer) {
        const row = startMenuRowAt(pointer.y);
        if (row !== -1 && row !== menuIndex) {
          menuIndex = row;
          break;
        }
      }
      mode = START_MENU.items[menuIndex].id;
      state = STATES.SELECT;
      break;
    }

    case STATES.SELECT: {
      if (pointer) {
        const row = characterRowAt(pointer.y, player.characters.length);
        if (row !== -1 && row !== selectedIndex) {
          selectedIndex = row;
          break;
        }
        if (row === -1 && pointer.y < SELECT_LAYOUT.startZoneY) break;
      }
      startRun();
      break;
    }

    case STATES.PLAYING:
      game.jump();
      break;

    case STATES.PAUSED:
      state = STATES.PLAYING;
      break;

    case STATES.GAME_OVER:
      if (gameOverInputReady()) startRun();
      break;

    case STATES.STATS:
    case STATES.ACHIEVEMENTS:
      startRun();
      break;
  }
}

// --- Клавиатура ---

const PREVENTED_KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown']);
const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
const DUCK_KEYS = new Set(['ArrowDown', 'KeyS']);

/**
 * Идентификатор клавиши в формате KeyboardEvent.code.
 * Некоторые экранные и виртуальные клавиатуры присылают пустой code,
 * тогда восстанавливаем его из key.
 */
function keyId(e) {
  if (e.code) return e.code;
  const key = e.key ?? '';
  if (key === ' ' || key === 'Spacebar') return 'Space';
  if (/^[a-z]$/i.test(key)) return `Key${key.toUpperCase()}`;
  return key;
}

document.addEventListener('keydown', (e) => {
  const code = keyId(e);
  if (PREVENTED_KEYS.has(code)) e.preventDefault();
  audio.unlock();

  if (code === 'KeyM' && !e.repeat) {
    toggleMute();
    return;
  }

  // Прыжок с автоповтором клавиши разрешён: удержание даёт серию прыжков.
  if (state === STATES.PLAYING) {
    if (JUMP_KEYS.has(code)) game.jump();
    else if (DUCK_KEYS.has(code)) game.duckDown();
    else if ((code === 'Escape' || code === 'KeyP') && !e.repeat) state = STATES.PAUSED;
    return;
  }

  if (e.repeat) return; // Переходы между экранами только по свежему нажатию.

  switch (state) {
    case STATES.START:
      if (code === 'ArrowUp') menuIndex = Math.max(0, menuIndex - 1);
      else if (code === 'ArrowDown') menuIndex = Math.min(START_MENU.items.length - 1, menuIndex + 1);
      else if (code === 'Enter' || code === 'Space') primaryAction();
      break;

    case STATES.SELECT:
      if (code === 'ArrowUp') selectedIndex = Math.max(0, selectedIndex - 1);
      else if (code === 'ArrowDown') selectedIndex = Math.min(player.characters.length - 1, selectedIndex + 1);
      else if (code === 'Enter' || code === 'Space') primaryAction();
      else if (code === 'Escape') state = STATES.START;
      break;

    case STATES.PAUSED:
      if (['Escape', 'KeyP', 'Space', 'Enter'].includes(code)) primaryAction();
      break;

    case STATES.GAME_OVER:
      if (!gameOverInputReady()) break;
      if (code === 'Space' || code === 'Enter' || code === 'KeyR') primaryAction();
      else if (code === 'KeyS') state = STATES.STATS;
      else if (code === 'KeyA') state = STATES.ACHIEVEMENTS;
      else if (code === 'KeyC') state = STATES.SELECT;
      else if (code === 'Escape') state = STATES.START;
      break;

    case STATES.STATS:
      if (code === 'Space' || code === 'Enter' || code === 'KeyR') primaryAction();
      else if (code === 'KeyA') state = STATES.ACHIEVEMENTS;
      else if (code === 'Escape' || code === 'KeyS') state = STATES.GAME_OVER;
      break;

    case STATES.ACHIEVEMENTS:
      if (code === 'Space' || code === 'Enter' || code === 'KeyR') primaryAction();
      else if (code === 'Escape' || code === 'KeyA') state = STATES.STATS;
      break;
  }
});

document.addEventListener('keyup', (e) => {
  const code = keyId(e);
  if (state !== STATES.PLAYING) return;
  if (JUMP_KEYS.has(code)) game.cutJump();
  else if (DUCK_KEYS.has(code)) game.duckUp();
});

// --- Указатель: мышь и тач ---
// Тап прыгает, свайп вниз во время касания приседает или ускоряет падение.

const SWIPE_DOWN_THRESHOLD = 35; // px в логических координатах холста
let pointerStart = null;
let pointerDucking = false;

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  audio.unlock();
  const point = pointerToCanvas(e);
  pointerStart = point;
  pointerDucking = false;
  primaryAction(point);
});

canvas.addEventListener('pointermove', (e) => {
  if (!pointerStart || pointerDucking || state !== STATES.PLAYING) return;
  const point = pointerToCanvas(e);
  if (point.y - pointerStart.y > SWIPE_DOWN_THRESHOLD) {
    pointerDucking = true;
    game.duckDown();
  }
});

function releasePointer() {
  pointerStart = null;
  if (state === STATES.PLAYING) {
    game.cutJump();
    if (pointerDucking) game.duckUp();
  }
  pointerDucking = false;
}

canvas.addEventListener('pointerup', releasePointer);
canvas.addEventListener('pointercancel', releasePointer);
canvas.addEventListener('pointerleave', releasePointer);

// Уход с вкладки ставит игру на паузу, иначе после возврата прилетит пачка препятствий.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === STATES.PLAYING) state = STATES.PAUSED;
});

window.addEventListener('resize', resizeCanvas);

// --- Главный цикл ---

function frame(now) {
  const rawDt = (now - lastFrameTime) / 1000;
  lastFrameTime = now;
  const dt = Math.min(rawDt, PHYSICS.maxDeltaTime);
  elapsed += dt;

  background.update(dt);

  const inWorld = state === STATES.PLAYING || state === STATES.GAME_OVER || state === STATES.PAUSED;
  if (state === STATES.PLAYING || state === STATES.GAME_OVER) {
    game.update(dt);
    if (state === STATES.PLAYING && game.isOver) finishRun();
  } else if (!inWorld) {
    // Меню живёт: мир медленно едет, чтобы экран не выглядел статичной картинкой.
    parallax.update(dt, 40);
    effects.update(dt);
  }

  ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);

  const shake = effects.shakeOffset;
  ctx.save();
  ctx.translate(shake.x, shake.y);
  background.draw(ctx);
  parallax.drawBack(ctx);
  parallax.drawFront(ctx);
  if (inWorld) game.draw(ctx, FONT);
  ctx.restore();

  const hud = { score: game.score, best: currentBest(), muted: audio.muted, mode };

  switch (state) {
    case STATES.START:
      drawStartScreen(ctx, {
        time: elapsed,
        best: save.best,
        dailyBest: save.daily.date === todayKey() ? save.daily.best : 0,
        selectedIndex: menuIndex,
      });
      break;
    case STATES.SELECT:
      drawCharacterSelectScreen(ctx, { characters: player.characters, selectedIndex, mode });
      break;
    case STATES.PLAYING:
      drawHud(ctx, hud);
      break;
    case STATES.PAUSED:
      drawHud(ctx, hud);
      drawPauseScreen(ctx);
      break;
    case STATES.GAME_OVER:
      drawHud(ctx, hud);
      if (game.timeSinceOver >= GAME_OVER_SCREEN_DELAY) {
        drawGameOverScreen(ctx, {
          score: game.score,
          best: save.best,
          isNewBest: lastResult.isNewBest,
          isNewDailyBest: lastResult.isNewDailyBest,
          mode,
          dailyBest: currentBest(),
          inputReady: gameOverInputReady(),
          time: elapsed,
        });
      }
      break;
    case STATES.STATS:
      drawStatsScreen(ctx, {
        best: save.best,
        recent: save.recent,
        daily: save.daily,
        achievementsCount: save.achievements.length,
        todayKey: todayKey(),
      });
      break;
    case STATES.ACHIEVEMENTS:
      drawAchievementsScreen(ctx, { unlockedIds: save.achievements });
      break;
  }

  effects.drawToasts(ctx, FONT);

  requestAnimationFrame(frame);
}

// --- Запуск ---

// Отладочный доступ к состоянию только в dev-сборке.
if (import.meta.env.DEV) {
  window.flameJumper = { game, player, obstacles, effects, getState: () => state };
}

// Service worker для офлайн-режима и установки как PWA. Только в продакшен-сборке.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((err) => {
      console.warn('Service worker registration failed', err);
    });
  });
}

async function init() {
  resizeCanvas();
  // Ждём шрифт, иначе первые кадры текста нарисуются запасным шрифтом.
  if (document.fonts?.load) {
    const timeout = new Promise((resolve) => setTimeout(resolve, 2000));
    await Promise.race([document.fonts.load("20px 'Pixelify Sans'"), timeout]).catch(() => {});
  }
  lastFrameTime = performance.now();
  requestAnimationFrame(frame);
}

init();
