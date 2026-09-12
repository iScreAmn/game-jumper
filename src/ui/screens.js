import { CANVAS } from '../game/config.js';
import { ACHIEVEMENTS } from '../game/achievements.js';

// Отрисовка экранов и HUD на холсте. Функции чистые относительно состояния:
// всё, что им нужно, приходит аргументами.

const FONT = "'Pixelify Sans', system-ui, sans-serif";
const ACCENT = '#f3b56a';
const HIGHLIGHT = '#ffe066';
const MUTED = 'rgba(255, 255, 255, 0.45)';

// Раскладка экрана выбора персонажа. Экспортируется для хит-теста по тапу.
const SELECT_LAYOUT = {
  firstRowY: 175,
  rowSpacing: 80,
  rowHeight: 72,
  startZoneY: 400, // всё ниже этой линии считается кнопкой старта
};

// Раскладка меню на стартовом экране.
const START_MENU = {
  items: [
    { id: 'endless', label: 'Endless run' },
    { id: 'daily', label: 'Daily challenge' },
  ],
  firstRowY: 350,
  rowSpacing: 46,
  rowHeight: 40,
};

function text(ctx, str, x, y, { size = 20, align = 'center', color = '#fff', weight = '' } = {}) {
  ctx.font = `${weight} ${size}px ${FONT}`.trim();
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  ctx.fillText(str, x, y);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

function overlay(ctx, alpha = 0.55) {
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
}

function panel(ctx, x, y, width, height) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  roundRect(ctx, x, y, width, height, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 224, 102, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function highlightRow(ctx, y, height) {
  ctx.fillStyle = 'rgba(255, 224, 102, 0.18)';
  roundRect(ctx, 90, y - height / 2, CANVAS.width - 180, height, 12);
  ctx.fill();
}

/** Мигание подсказки: видна две трети периода. */
function blinkVisible(time, period = 1.2) {
  return (time % period) / period < 0.66;
}

function drawHud(ctx, { score, best, muted, mode }) {
  text(ctx, `🚀 ${score}`, 20, 42, { size: 28, align: 'left' });
  const bestLabel = mode === 'daily' ? `TODAY ${best}` : `BEST ${best}`;
  text(ctx, bestLabel, CANVAS.width - 20, 38, { size: 18, align: 'right', color: ACCENT });
  if (muted) {
    text(ctx, '🔇', CANVAS.width - 20, 66, { size: 18, align: 'right' });
  }
}

function drawStartScreen(ctx, { time, best, dailyBest, selectedIndex }) {
  overlay(ctx, 0.35);
  text(ctx, 'FLAME', CANVAS.width / 2, 160, { size: 84 });
  text(ctx, 'JUMPER', CANVAS.width / 2, 235, { size: 84, color: ACCENT });
  if (best > 0) {
    text(ctx, `Best score: ${best}`, CANVAS.width / 2, 285, { size: 22 });
  }

  START_MENU.items.forEach((item, index) => {
    const y = START_MENU.firstRowY + index * START_MENU.rowSpacing;
    const selected = index === selectedIndex;
    if (selected) highlightRow(ctx, y - 10, START_MENU.rowHeight);
    let label = item.label;
    if (item.id === 'daily' && dailyBest > 0) label += `  ·  today ${dailyBest}`;
    text(ctx, selected ? `> ${label} <` : label, CANVAS.width / 2, y, {
      size: 26,
      color: selected ? HIGHLIGHT : '#fff',
    });
  });

  if (blinkVisible(time)) {
    text(ctx, 'ENTER or TAP to play', CANVAS.width / 2, 465, { size: 20, color: ACCENT });
  }
}

/** Индекс пункта стартового меню по координате y, либо -1. */
function startMenuRowAt(y) {
  for (let i = 0; i < START_MENU.items.length; i++) {
    const centerY = START_MENU.firstRowY + i * START_MENU.rowSpacing - 10;
    if (Math.abs(y - centerY) <= START_MENU.rowHeight / 2) return i;
  }
  return -1;
}

function drawCharacterSelectScreen(ctx, { characters, selectedIndex, mode }) {
  overlay(ctx, 0.55);
  text(ctx, 'Select character', CANVAS.width / 2, 90, { size: 40 });
  if (mode === 'daily') {
    text(ctx, 'Daily challenge', CANVAS.width / 2, 120, { size: 20, color: ACCENT });
  }

  const { firstRowY, rowSpacing, rowHeight } = SELECT_LAYOUT;
  const spriteHeight = 60;

  characters.forEach((char, index) => {
    const centerY = firstRowY + index * rowSpacing;
    const selected = index === selectedIndex;
    if (selected) highlightRow(ctx, centerY, rowHeight);

    const sprite = char.sprite;
    if (sprite?.complete && sprite.width > 0) {
      const spriteWidth = spriteHeight * (sprite.width / sprite.height);
      ctx.drawImage(sprite, 130, centerY - spriteHeight / 2, spriteWidth, spriteHeight);
    }

    text(ctx, selected ? `> ${char.name}` : char.name, 200, centerY + 10, {
      size: 30,
      align: 'left',
      color: selected ? HIGHLIGHT : '#fff',
    });
  });

  text(ctx, 'ENTER or TAP to start', CANVAS.width / 2, 440, { size: 24 });
  text(ctx, '↑ ↓ select    ESC back', CANVAS.width / 2, 472, { size: 18, color: ACCENT });
}

/** Возвращает индекс строки персонажа по координате y, либо -1. */
function characterRowAt(y, count) {
  const { firstRowY, rowSpacing, rowHeight } = SELECT_LAYOUT;
  for (let i = 0; i < count; i++) {
    const centerY = firstRowY + i * rowSpacing;
    if (Math.abs(y - centerY) <= rowHeight / 2) return i;
  }
  return -1;
}

function drawPauseScreen(ctx) {
  overlay(ctx, 0.55);
  text(ctx, 'PAUSED', CANVAS.width / 2, 240, { size: 64 });
  text(ctx, 'ESC, P or TAP to resume', CANVAS.width / 2, 300, { size: 22 });
}

function drawGameOverScreen(ctx, { score, best, isNewBest, isNewDailyBest, mode, dailyBest, inputReady, time }) {
  overlay(ctx, 0.6);
  text(ctx, 'GAME OVER', CANVAS.width / 2, 190, { size: 66 });
  text(ctx, `Score: ${score}`, CANVAS.width / 2, 245, { size: 32 });

  if (mode === 'daily') {
    const label = isNewDailyBest ? 'NEW DAILY BEST!' : `Today's best: ${dailyBest}`;
    text(ctx, label, CANVAS.width / 2, 285, { size: 24, color: isNewDailyBest ? HIGHLIGHT : ACCENT });
    text(ctx, `All-time best: ${best}`, CANVAS.width / 2, 315, { size: 18, color: MUTED });
  } else if (isNewBest) {
    text(ctx, 'NEW BEST!', CANVAS.width / 2, 285, { size: 28, color: HIGHLIGHT });
  } else {
    text(ctx, `Best: ${best}`, CANVAS.width / 2, 285, { size: 24, color: ACCENT });
  }

  if (inputReady && blinkVisible(time)) {
    text(ctx, 'SPACE or TAP to restart', CANVAS.width / 2, 390, { size: 26 });
  }
  text(ctx, 'S stats   A awards   C character   ESC menu', CANVAS.width / 2, 430, { size: 16, color: ACCENT });
}

function drawStatsScreen(ctx, { best, recent, daily, achievementsCount, todayKey }) {
  overlay(ctx, 0.7);
  text(ctx, `Best score: ${best}`, CANVAS.width / 2, 70, { size: 38, color: HIGHLIGHT });

  const dailyLabel = daily.date === todayKey && daily.best > 0 ? `Today's daily: ${daily.best}` : 'Daily challenge: not played today';
  text(ctx, dailyLabel, CANVAS.width / 2, 105, { size: 18, color: ACCENT });
  text(ctx, `Achievements: ${achievementsCount} / ${ACHIEVEMENTS.length}`, CANVAS.width / 2, 132, { size: 18, color: ACCENT });

  if (recent.length === 0) {
    text(ctx, 'No runs yet', CANVAS.width / 2, 260, { size: 28 });
  } else {
    text(ctx, 'Recent runs', CANVAS.width / 2, 185, { size: 24 });
    const rows = [...recent].reverse().slice(0, 6);
    rows.forEach((value, index) => {
      const runNumber = recent.length - index;
      const y = 222 + index * 30;
      text(ctx, `Run ${runNumber}`, 170, y, { size: 22, align: 'left' });
      text(ctx, String(value), 330, y, { size: 22, align: 'right', color: value === best ? HIGHLIGHT : '#fff' });
    });
  }

  text(ctx, 'SPACE or TAP to restart', CANVAS.width / 2, 440, { size: 24 });
  text(ctx, 'A awards    ESC back', CANVAS.width / 2, 472, { size: 18, color: ACCENT });
}

function drawAchievementsScreen(ctx, { unlockedIds }) {
  overlay(ctx, 0.7);
  const unlocked = new Set(unlockedIds);
  text(ctx, `Achievements ${unlocked.size} / ${ACHIEVEMENTS.length}`, CANVAS.width / 2, 60, { size: 32, color: HIGHLIGHT });

  panel(ctx, 40, 85, CANVAS.width - 80, 330);
  ACHIEVEMENTS.forEach((achievement, index) => {
    const y = 115 + index * 34;
    const done = unlocked.has(achievement.id);
    text(ctx, done ? '★' : '☆', 62, y, { size: 22, align: 'left', color: done ? HIGHLIGHT : MUTED });
    text(ctx, achievement.title, 92, y, { size: 20, align: 'left', color: done ? '#fff' : MUTED });
    text(ctx, achievement.description, CANVAS.width - 62, y, { size: 14, align: 'right', color: done ? ACCENT : MUTED });
  });

  text(ctx, 'SPACE or TAP to restart', CANVAS.width / 2, 445, { size: 22 });
  text(ctx, 'ESC back', CANVAS.width / 2, 474, { size: 18, color: ACCENT });
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export {
  FONT,
  SELECT_LAYOUT,
  START_MENU,
  startMenuRowAt,
  drawHud,
  drawStartScreen,
  drawCharacterSelectScreen,
  characterRowAt,
  drawPauseScreen,
  drawGameOverScreen,
  drawStatsScreen,
  drawAchievementsScreen,
};
