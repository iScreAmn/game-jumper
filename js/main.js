
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 500;
canvas.height = 500;

// Устанавливаем начальный фон
canvas.style.backgroundImage = "url('../img/levels/level_sq_1.webp')";

// Добавлено: переменные для управления состоянием игры
let isGameOver = false;
let intervalId = null;
let showStats = false; // Новый флаг для отображения статистики
let isBackgroundChanged = false; // Флаг для отслеживания смены фона

const characterImg = new Image();
characterImg.src = "./img/person.webp";
characterImg.onload = () => console.log("Character loaded!");

const obstacleImg = new Image();
obstacleImg.src = "./img/obstracle.png";
obstacleImg.onload = () => console.log("Obstacle loaded!");

const initialObstacleInterval = 2000; // Начальный интервал (2 секунды)
let obstacleInterval = initialObstacleInterval; // Текущий интервал

let character = {
  x: 50,
  y: 280,
  width: 80,
  height: 80,
  dy: 0,
  gravity: 0.5,
  jumpPower: -12.5,
  onGround: true,
};

let obstacles = [];
let gameSpeed = 4; // Начальная скорость игры
let score = 0;
let gameStarted = false;



// Добавлено: функция для получения статистики
function getSessionStats() {
  const stats = sessionStorage.getItem("gameStats");
  return stats ? JSON.parse(stats) : [];
}

// Добавлено: функция для сохранения статистики
function saveSessionStats(score) {
  const stats = getSessionStats();
  stats.push(score);
  sessionStorage.setItem("gameStats", JSON.stringify(stats));
}

// Добавлено: функция для отображения статистики
function drawStats() {
  const stats = getSessionStats();
  if (stats.length === 0) return;

  ctx.fillStyle = "#fff";
  ctx.font = "20px 'Pixelify Sans', serif";
  ctx.textAlign = "center";

  // Лучший результат
  const bestScore = Math.max(...stats);
  ctx.fillText(`Best Score: ${bestScore}`, canvas.width / 2, canvas.height / 2 - 70);

  // Последние 5 игр
  const recentGames = stats.slice(-5).reverse();
  ctx.fillText("Recent Jumps:", canvas.width / 2, canvas.height / 2 - 30);
  recentGames.forEach((gameScore, index) => {
    ctx.fillText(`Game ${index + 1}: ${gameScore}`, canvas.width / 2, canvas.height / 2 + index * 30);
  });

  // Добавлено: надпись "Press R to continue"
  ctx.font = "30px 'Pixelify Sans', serif";
  ctx.fillText("Press R to restart", canvas.width / 2, canvas.height - 50);
}

function drawCharacter() {
  ctx.drawImage(characterImg, character.x, character.y, character.width, character.height);
}


// Titles
function drawStartScreen() {
  // Проверяем, загружены ли шрифты
  document.fonts.ready.then(() => {
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "80px 'Pixelify Sans'"; // Убедимся, что шрифт загружен
    ctx.fillText("START", canvas.width / 2, canvas.height / 2 + 50);
  }).catch((error) => {
    console.error("Ошибка загрузки шрифта:", error);
    // Если шрифт не загрузился, используем запасной вариант
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "80px serif"; // Запасной шрифт
    ctx.fillText("START", canvas.width / 2, canvas.height / 2 + 50);
  });
}

// Изменено: экран завершения игры без статистики
function drawGameOver() {
  ctx.fillStyle = "#fff";
  ctx.font = "40px 'Pixelify Sans', serif";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 50);
  ctx.font = "30px 'Pixelify Sans', serif";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
  ctx.font = "30px 'Pixelify Sans', serif";
  ctx.fillText("Press R to continue", canvas.width / 2, canvas.height - 50);
}

function jump() {
  if (character.onGround && !isGameOver) {
    character.dy = character.jumpPower;
    character.onGround = false;
  }
}

function updateCharacter() {
  if (isGameOver) return;

  character.y += character.dy;
  character.dy += character.gravity;

  if (character.y >= 280) {
    character.y = 280;
    character.onGround = true;
  }
}

function generateObstacle() {
  obstacles.push({ x: canvas.width, y: 300, width: 40, height: 50 });
}

function updateObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= gameSpeed;

    if (obstacles[i].x + obstacles[i].width < 0) {
      obstacles.splice(i, 1);
      score++;
      document.getElementById("score").textContent = score;

      // Проверка на 15 очков и изменение фона/скорости
      if (score >= 15 && !isBackgroundChanged) {
        canvas.style.backgroundImage = "url('../img/levels/level_sq_2.webp')";
        gameSpeed = 6; // Увеличиваем скорость
        obstacleInterval = 1000; // Уменьшаем интервал генерации
        clearInterval(intervalId); // Очищаем старый интервал
        intervalId = setInterval(generateObstacle, obstacleInterval); // Устанавливаем новый интервал
        isBackgroundChanged = true; // Флаг, чтобы изменения произошли только один раз
      }
      continue;
    }

    ctx.drawImage(
      obstacleImg,
      obstacles[i].x,
      obstacles[i].y,
      obstacles[i].width,
      obstacles[i].height
    );

    // Изменено: обработка столкновений
    if (
      !isGameOver &&
      character.x < obstacles[i].x + obstacles[i].width &&
      character.x + character.width > obstacles[i].x &&
      character.y < obstacles[i].y + obstacles[i].height &&
      character.y + character.height > obstacles[i].y
    ) {
      gameOver();
    }
  }
}

// Изменено: функция завершения игры с сохранением статистики
function gameOver() {
  isGameOver = true;
  gameStarted = false;
  clearInterval(intervalId); // Очищаем интервал
  saveSessionStats(score); // Сохраняем результат
  drawGameOver(); // Отображаем экран завершения игры
}

// Добавлено: функция рестарта игры
function resetGame() {
  isGameOver = false;
  gameStarted = false;
  showStats = true; // Переключаем в режим отображения статистики
  obstacles = [];
  score = 0;
  character = {
    x: 50,
    y: 280,
    width: 80,
    height: 80,
    dy: 0,
    gravity: 0.5,
    jumpPower: -12.5,
    onGround: true,
  };
  document.getElementById("score").textContent = "0";
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Сбрасываем фон и скорость
  canvas.style.backgroundImage = "url('../img/levels/level_sq_1.webp')";
  gameSpeed = 4;
  isBackgroundChanged = false;

  if (showStats) {
    drawStats(); // Отображаем только статистику
  } else {
    drawStartScreen(); // Отображаем стартовый экран
  }
}

// Изменено: обработчик клавиш
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (!gameStarted && !isGameOver) {
      // Старт игры при нажатии Space
      gameStarted = true;
      intervalId = setInterval(generateObstacle, 2000);
      gameLoop();
    } else if (gameStarted && !isGameOver) {
      // Прыжок работает только во время игры
      jump();
    }
  }

  if (e.code === "KeyR") {
    if (isGameOver && !showStats) {
      // Первое нажатие R: переход к экрану статистики
      resetGame(); // Показываем статистику
    } else if (showStats) {
      // Второе нажатие R: возврат к стартовому экрану
      showStats = false; // Сбрасываем флаг статистики
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Очищаем холст
      drawStartScreen(); // Явно рисуем стартовый экран
      
      // Полный сброс состояния игры
      obstacles = [];
      score = 0;
      gameSpeed = 4;
      isBackgroundChanged = false;
      document.getElementById("score").textContent = "0";
    }
  }
});

// Изменено: игровой цикл
function gameLoop() {
  if (isGameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCharacter();
  updateCharacter();
  updateObstacles();
  requestAnimationFrame(gameLoop);
}

drawStartScreen();