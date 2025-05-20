// src/main.js

import './src/styles/main.css'; // Подключаем стили

import { Player, CHARACTER_DEFINITIONS } from './src/game/player.js';
import { ObstacleManager } from './src/game/obstacles.js';
import { GameLoop } from './src/game/gameLoop.js';
import { resetLevels, applyLevelSettings, LEVEL_CONFIGS } from './src/game/levels.js';

// Получаем элементы canvas и устанавливаем размер
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 500; // Как в оригинале
canvas.height = 500; // Как в оригинале

const scoreDisplay = document.getElementById('score'); // Элемент для отображения счета

// Состояния игры
let gameState = 'START_SCREEN'; // START_SCREEN, CHARACTER_SELECTION, PLAYING, GAME_OVER, STATS_SCREEN
let selectedCharacterIndexForStart = 0; // Для навигации на экране выбора

// Инициализация основных компонентов игры
const player = new Player(canvas);
const obstacleManager = new ObstacleManager(canvas);

// UIManager - объект или набор функций для управления отображением UI
const uiManager = {
  updateScoreDisplay: (score) => {
    if (scoreDisplay) scoreDisplay.textContent = score;
  },
  showGameOverScreen: (finalScore) => {
    gameState = 'GAME_OVER';
    saveSessionStats(finalScore); // Сохраняем статистику
    drawGameOverScreen(finalScore);
  },
  // Можно добавить и другие методы для управления UI, если потребуется
};

const gameLoop = new GameLoop(canvas, ctx, player, obstacleManager, uiManager);


// --- Функции отрисовки экранов ---

function drawStartScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Фон canvas уже должен быть установлен через resetLevels -> applyLevelSettings
  
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  
  ctx.font = "90px 'Pixelify Sans'";
  ctx.fillText("START", canvas.width / 2, 300);

  ctx.font = "25px 'Pixelify Sans'";
  ctx.fillText("Press ENTER", canvas.width / 2, 400);
  ctx.fillText("to select character", canvas.width / 2, 430);
  ctx.font = "15px 'Pixelify Sans'";
  // ctx.fillText("Use ARROWS to navigate, SPACE to jump in game", canvas.width / 2, 320);
}

function drawCharacterSelectionScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  
  ctx.font = "40px 'Pixelify Sans'";
  ctx.fillText("Select Character", canvas.width / 2, 150);

  const chars = player.getCharacterDefinitionsForSelection(); // Получаем персонажей
  const charSpriteHeight = 70; // Примерная высота для отображения
  const startY = 180;
  const spacingY = 55;

  chars.forEach((char, index) => {
    const yPos = startY + index * spacingY;
    
    // Отрисовка спрайта персонажа
    const sprite = char.sprite; // Это уже Image объект
    if (sprite && sprite.complete) { // Убедимся, что спрайт загружен
        const aspectRatio = sprite.width / sprite.height;
        const displayWidth = charSpriteHeight * aspectRatio;
        ctx.drawImage(sprite, canvas.width / 2 - displayWidth / 2, yPos - charSpriteHeight / 1.5, displayWidth, charSpriteHeight);
    }


    ctx.font = "30px 'Pixelify Sans'";
    if (index === selectedCharacterIndexForStart) {
      ctx.fillStyle = "yellow"; // Выделение выбранного
      ctx.fillText(`> ${char.name} <`, canvas.width / 2, yPos + charSpriteHeight / 2 + 20);
      ctx.fillStyle = "#fff";
    } else {
      ctx.fillText(char.name, canvas.width / 2, yPos + charSpriteHeight / 2 + 20);
    }
  });

  ctx.font = "25px 'Pixelify Sans'";
  ctx.fillText("Press ENTER to start", canvas.width / 2, canvas.height - 70);
  ctx.font = "20px 'Pixelify Sans'";
  ctx.fillText("ESC to go back", canvas.width / 2, canvas.height - 40);
}

function drawGameOverScreen(finalScore) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";

  ctx.font = "80px 'Pixelify Sans'";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height - 200);
  
  ctx.font = "30px 'Pixelify Sans'";
  ctx.fillText(`Score: ${finalScore}`, canvas.width / 2, canvas.height - 380);
  
  ctx.font = "25px 'Pixelify Sans'";
  ctx.fillText("Press R to view stats", canvas.width / 2, canvas.height - 100);
}

function drawStatsScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const stats = getSessionStats();
  
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = "40px 'Pixelify Sans'";

  if (stats.length === 0) {
    ctx.fillText("No stats yet!", canvas.width / 2, canvas.height / 2 - 30);
  } else {
    const bestScore = Math.max(...stats);
    ctx.fillText(`Best Score: ${bestScore}`, canvas.width / 2, 100);

    ctx.font = "30px 'Pixelify Sans'";
    ctx.fillText("Recent Jumps:", canvas.width / 2, 180);
    
    const recentGames = stats.slice(-5).reverse(); // Последние 5 игр
    recentGames.forEach((gameScore, index) => {
      ctx.font = "25px 'Pixelify Sans'";
      ctx.fillText(`Game ${stats.length - index}: ${gameScore}`, canvas.width / 2, 240 + index * 40);
    });
  }

  ctx.font = "30px 'Pixelify Sans'";
  ctx.fillText("Press R to restart", canvas.width / 2, canvas.height - 45);
}


// --- Управление статистикой сессии ---
function getSessionStats() {
  const stats = sessionStorage.getItem("flameJumperStats");
  return stats ? JSON.parse(stats) : [];
}

function saveSessionStats(score) {
  const stats = getSessionStats();
  stats.push(score);
  sessionStorage.setItem("flameJumperStats", JSON.stringify(stats));
}

// --- Сброс и инициализация игры ---
function resetGame() {
  resetLevels(canvas); // Сброс на первый уровень (фон, градиент body)
  player.reset(LEVEL_CONFIGS[0]); // Сброс игрока с настройками первого уровня
  player.selectCharacter(selectedCharacterIndexForStart); // Устанавливаем выбранного персонажа
  obstacleManager.reset();
  if (scoreDisplay) scoreDisplay.textContent = "0";
  // gameState будет изменен в зависимости от того, куда мы переходим (STATS_SCREEN или START_SCREEN)
}


// --- Обработка ввода ---
document.addEventListener("keydown", (e) => {
  switch (gameState) {
    case 'START_SCREEN':
      if (e.code === 'Enter') {
        gameState = 'CHARACTER_SELECTION';
        selectedCharacterIndexForStart = player.selectedCharacterIndex; // Синхронизируем для навигации
        drawCharacterSelectionScreen();
      }
      break;

    case 'CHARACTER_SELECTION':
      if (e.code === 'ArrowUp') {
        selectedCharacterIndexForStart = Math.max(0, selectedCharacterIndexForStart - 1);
        drawCharacterSelectionScreen();
      } else if (e.code === 'ArrowDown') {
        selectedCharacterIndexForStart = Math.min(CHARACTER_DEFINITIONS.length - 1, selectedCharacterIndexForStart + 1);
        drawCharacterSelectionScreen();
      } else if (e.code === 'Enter') {
        player.selectCharacter(selectedCharacterIndexForStart);
        gameState = 'PLAYING';
        gameLoop.start();
      } else if (e.code === 'Escape') {
        gameState = 'START_SCREEN';
        drawStartScreen();
      }
      break;

    case 'PLAYING':
      if (e.code === 'Space') {
        player.jump();
      }
      // Можно добавить паузу по Esc, если нужно
      break;

    case 'GAME_OVER':
      if (e.code === 'KeyR') {
        gameState = 'STATS_SCREEN';
        drawStatsScreen();
      }
      break;

    case 'STATS_SCREEN':
      if (e.code === 'KeyR') {
        gameState = 'START_SCREEN';
        resetGame(); // Полный сброс перед новым стартовым экраном
        drawStartScreen();
      }
      break;
  }
});

// Для мобильных или кликов мышью (только прыжок во время игры)
canvas.addEventListener('click', () => {
  if (gameState === 'PLAYING') {
    player.jump();
  }
});


// --- Начало работы ---
function init() {
  // Устанавливаем начальный фон и градиент через levels.js
  resetLevels(canvas); // Это применит фон и градиент 0-го уровня
  // Начальное состояние игры
  gameState = 'START_SCREEN';
  drawStartScreen();
  if (scoreDisplay) scoreDisplay.textContent = "0"; // Изначально счет 0
}

// Запускаем инициализацию после загрузки DOM и всех ресурсов (особенно шрифтов)
// Используем document.fonts.ready для ожидания загрузки шрифтов, чтобы текст рисовался корректно
if (document.fonts) {
    document.fonts.ready.then(init).catch(err => {
        console.error("Font loading error or timeout, starting init anyway.", err);
        init(); // Все равно запускаем, если шрифты не загрузились (редкий случай)
    });
} else {
    // Fallback для браузеров без document.fonts
    window.onload = init;
}
