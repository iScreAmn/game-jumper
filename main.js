import { Player } from './src/game/player.js';
import { ObstacleManager } from './src/game/obstacles.js';
import { LevelBackground } from './src/game/levels.js';
import { Game } from './src/game/game.js';
import { AudioManager } from './src/game/audio.js';
import { loadSave, updateSave, recordGame } from './src/game/storage.js';
import { CANVAS, GAME_OVER_INPUT_DELAY, PHYSICS } from './src/game/config.js';
import {
  SELECT_LAYOUT,
  characterRowAt,
  drawHud,
  drawStartScreen,
  drawCharacterSelectScreen,
  drawPauseScreen,
  drawGameOverScreen,
  drawStatsScreen,
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
};

let state = STATES.START;
let save = loadSave();
let selectedIndex = save.characterIndex;
let lastResult = { isNewBest: false };
let elapsed = 0; // общее время для анимаций подсказок
let lastFrameTime = 0;

const audio = new AudioManager();
audio.setMuted(save.muted);

const player = new Player();
player.selectCharacter(selectedIndex);
const obstacles = new ObstacleManager();
const background = new LevelBackground();
const game = new Game({ player, obstacles, background, audio });

// --- Переходы ---

function startRun() {
  player.selectCharacter(selectedIndex);
  save = updateSave({ characterIndex: selectedIndex });
  game.start();
  state = STATES.PLAYING;
}

function finishRun() {
  const result = recordGame(game.score);
  save = result.save;
  lastResult = { isNewBest: result.isNewBest };
  state = STATES.GAME_OVER;
}

function toggleMute() {
  const muted = audio.toggleMuted();
  save = updateSave({ muted });
}

function gameOverInputReady() {
  return game.timeSinceOver >= GAME_OVER_INPUT_DELAY;
}

// --- Универсальное действие: Enter, Space или тап ---

function primaryAction(pointer = null) {
  switch (state) {
    case STATES.START:
      state = STATES.SELECT;
      break;

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
      startRun();
      break;
  }
}

// --- Клавиатура ---

const PREVENTED_KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown']);

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
    if (code === 'Space' || code === 'ArrowUp') game.jump();
    else if ((code === 'Escape' || code === 'KeyP') && !e.repeat) state = STATES.PAUSED;
    return;
  }

  if (e.repeat) return; // Переходы между экранами только по свежему нажатию.

  switch (state) {
    case STATES.START:
      if (code === 'Enter' || code === 'Space') primaryAction();
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
      else if (code === 'KeyC' || code === 'Escape') state = STATES.SELECT;
      break;

    case STATES.STATS:
      if (code === 'Space' || code === 'Enter' || code === 'KeyR') primaryAction();
      else if (code === 'Escape' || code === 'KeyS') state = STATES.GAME_OVER;
      break;
  }
});

document.addEventListener('keyup', (e) => {
  const code = keyId(e);
  if (state === STATES.PLAYING && (code === 'Space' || code === 'ArrowUp')) {
    game.cutJump();
  }
});

// --- Указатель: мышь и тач ---

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  audio.unlock();
  primaryAction(pointerToCanvas(e));
});

canvas.addEventListener('pointerup', () => {
  if (state === STATES.PLAYING) game.cutJump();
});

canvas.addEventListener('pointercancel', () => {
  if (state === STATES.PLAYING) game.cutJump();
});

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

  if (state === STATES.PLAYING || state === STATES.GAME_OVER) {
    game.update(dt);
    if (state === STATES.PLAYING && game.isOver) finishRun();
  }

  ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
  background.draw(ctx);

  const hud = { score: game.score, best: save.best, muted: audio.muted };

  switch (state) {
    case STATES.START:
      drawStartScreen(ctx, { time: elapsed, best: save.best });
      break;
    case STATES.SELECT:
      drawCharacterSelectScreen(ctx, { characters: player.characters, selectedIndex });
      break;
    case STATES.PLAYING:
      game.draw(ctx);
      drawHud(ctx, hud);
      break;
    case STATES.PAUSED:
      game.draw(ctx);
      drawHud(ctx, hud);
      drawPauseScreen(ctx);
      break;
    case STATES.GAME_OVER:
      game.draw(ctx);
      drawHud(ctx, hud);
      drawGameOverScreen(ctx, {
        score: game.score,
        best: save.best,
        isNewBest: lastResult.isNewBest,
        inputReady: gameOverInputReady(),
        time: elapsed,
      });
      break;
    case STATES.STATS:
      drawStatsScreen(ctx, { best: save.best, recent: save.recent });
      break;
  }

  requestAnimationFrame(frame);
}

// --- Запуск ---

// Отладочный доступ к состоянию только в dev-сборке.
if (import.meta.env.DEV) {
  window.flameJumper = { game, player, obstacles, getState: () => state };
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
