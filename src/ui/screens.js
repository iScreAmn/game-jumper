import { CANVAS } from '../game/config.js';

// Отрисовка экранов и HUD на холсте. Функции чистые относительно состояния:
// всё, что им нужно, приходит аргументами.

const FONT = "'Pixelify Sans', system-ui, sans-serif";
const ACCENT = '#f3b56a';
const HIGHLIGHT = '#ffe066';

// Раскладка экрана выбора персонажа. Экспортируется для хит-теста по тапу.
const SELECT_LAYOUT = {
  firstRowY: 175,
  rowSpacing: 80,
  rowHeight: 72,
  startZoneY: 400, // всё ниже этой линии считается кнопкой старта
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

/** Мигание подсказки: видна две трети периода. */
function blinkVisible(time, period = 1.2) {
  return (time % period) / period < 0.66;
}

function drawHud(ctx, { score, best, muted }) {
  text(ctx, `🚀 ${score}`, 20, 42, { size: 28, align: 'left' });
  text(ctx, `BEST ${best}`, CANVAS.width - 20, 38, { size: 18, align: 'right', color: ACCENT });
  if (muted) {
    text(ctx, '🔇', CANVAS.width - 20, 66, { size: 18, align: 'right' });
  }
}

function drawStartScreen(ctx, { time, best }) {
  overlay(ctx, 0.35);
  text(ctx, 'FLAME', CANVAS.width / 2, 200, { size: 84 });
  text(ctx, 'JUMPER', CANVAS.width / 2, 275, { size: 84, color: ACCENT });
  if (best > 0) {
    text(ctx, `Best score: ${best}`, CANVAS.width / 2, 330, { size: 22 });
  }
  if (blinkVisible(time)) {
    text(ctx, 'Press ENTER or TAP', CANVAS.width / 2, 420, { size: 26 });
  }
}

function drawCharacterSelectScreen(ctx, { characters, selectedIndex }) {
  overlay(ctx, 0.55);
  text(ctx, 'Select character', CANVAS.width / 2, 100, { size: 40 });

  const { firstRowY, rowSpacing, rowHeight } = SELECT_LAYOUT;
  const spriteHeight = 60;

  characters.forEach((char, index) => {
    const centerY = firstRowY + index * rowSpacing;
    const selected = index === selectedIndex;

    if (selected) {
      ctx.fillStyle = 'rgba(255, 224, 102, 0.18)';
      roundRect(ctx, 90, centerY - rowHeight / 2, CANVAS.width - 180, rowHeight, 14);
      ctx.fill();
    }

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

function drawGameOverScreen(ctx, { score, best, isNewBest, inputReady, time }) {
  overlay(ctx, 0.6);
  text(ctx, 'GAME OVER', CANVAS.width / 2, 200, { size: 66 });
  text(ctx, `Score: ${score}`, CANVAS.width / 2, 255, { size: 32 });
  if (isNewBest) {
    text(ctx, 'NEW BEST!', CANVAS.width / 2, 295, { size: 28, color: HIGHLIGHT });
  } else {
    text(ctx, `Best: ${best}`, CANVAS.width / 2, 295, { size: 24, color: ACCENT });
  }
  if (inputReady && blinkVisible(time)) {
    text(ctx, 'SPACE or TAP to restart', CANVAS.width / 2, 390, { size: 26 });
  }
  text(ctx, 'S stats    C character', CANVAS.width / 2, 430, { size: 18, color: ACCENT });
}

function drawStatsScreen(ctx, { best, recent }) {
  overlay(ctx, 0.7);
  text(ctx, `Best score: ${best}`, CANVAS.width / 2, 80, { size: 38, color: HIGHLIGHT });

  if (recent.length === 0) {
    text(ctx, 'No runs yet', CANVAS.width / 2, 240, { size: 28 });
  } else {
    text(ctx, 'Recent runs', CANVAS.width / 2, 135, { size: 26, color: ACCENT });
    const rows = [...recent].reverse().slice(0, 8);
    rows.forEach((value, index) => {
      const runNumber = recent.length - index;
      text(ctx, `Run ${runNumber}`, 170, 180 + index * 30, { size: 22, align: 'left' });
      text(ctx, String(value), 330, 180 + index * 30, { size: 22, align: 'right' });
    });
  }

  text(ctx, 'SPACE or TAP to restart', CANVAS.width / 2, 440, { size: 24 });
  text(ctx, 'ESC back', CANVAS.width / 2, 472, { size: 18, color: ACCENT });
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
  SELECT_LAYOUT,
  drawHud,
  drawStartScreen,
  drawCharacterSelectScreen,
  characterRowAt,
  drawPauseScreen,
  drawGameOverScreen,
  drawStatsScreen,
};
