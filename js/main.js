const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 500;
canvas.height = 500;

// Устанавливаем начальный фон
canvas.style.backgroundImage = "url('../img/levels/level_sq_1.webp')";

// Состояния игры
let isGameOver = false;
let intervalId = null;
let showStats = false;
let isBackgroundChanged = false;

// Персонажи
const characters = [
  { name: "Amber", src: "./img/characters/character.webp" },
  { name: "Mario", src: "./img/characters/mario.webp" },
  { name: "Turtle", src: "./img/characters/turtle.webp" },
  // { name: "Ksu", src: "./img/characters/ksu.webp" }
];
let selectedCharacterIndex = 0;
const characterImg = new Image();
characterImg.src = characters[0].src;

// Загрузка всех изображений персонажей заранее
characters.forEach(char => {
  const img = new Image();
  img.src = char.src;
});

const obstacleImg = new Image();
obstacleImg.src = "./img/obstacles/obstacle.webp";

// Настройки игры
const initialObstacleInterval = 1000;
let obstacleInterval = initialObstacleInterval;
let character = {
  x: 50,
  y: 280,
  width: 45,
  height: 70,
  dy: 0,
  gravity: 0.5,
  jumpPower: -12.5,
  onGround: true,
};
let obstacles = [];
let gameSpeed = 4;
let score = 0;
let gameStarted = false;

// Отрисовка стартового экрана с выбором персонажа
function drawStartScreen() {
  document.fonts.ready.then(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    
    // Заголовок
    ctx.font = "80px 'Pixelify Sans'";
    ctx.fillText("START", canvas.width / 2, 250);

    // Список персонажей
    ctx.font = "30px 'Pixelify Sans'";
    characters.forEach((char, index) => {
      const yPos = 350 + index * 50;
      // Выделение выбранного персонажа
      if(index === selectedCharacterIndex) {
        ctx.fillText(">", canvas.width/2 - 100, yPos);
      }
      ctx.fillText(char.name, canvas.width/2, yPos);
    });

    // Инструкция
    // ctx.font = "20px 'Pixelify Sans'";
    // ctx.fillText("Use ↑ ↓ to select, ENTER to start", canvas.width/2, 400);
    
  }).catch(error => {
    console.error("Font load error:", error);
    // Fallback rendering
  });
}

// Обработка ввода для выбора персонажа
document.addEventListener("keydown", (e) => {
  if(!gameStarted && !isGameOver) {
    switch(e.code) {
      case "ArrowUp":
        selectedCharacterIndex = Math.max(0, selectedCharacterIndex - 1);
        drawStartScreen();
        break;
      case "ArrowDown":
        selectedCharacterIndex = Math.min(characters.length-1, selectedCharacterIndex + 1);
        drawStartScreen();
        break;
      case "Enter":
        // Загрузка выбранного персонажа
        characterImg.src = characters[selectedCharacterIndex].src;
        // Запуск игры
        gameStarted = true;
        intervalId = setInterval(generateObstacle, 2000);
        gameLoop();
        break;
    }
  }

  // Обработка прыжка
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

  // Обработка рестарта
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

// Функция прыжка
function jump() {
  if (character.onGround && !isGameOver) {
    character.dy = character.jumpPower;
    character.onGround = false;
  }
}

// Обновление состояния персонажа
function updateCharacter() {
  if (isGameOver) return;

  character.y += character.dy;
  character.dy += character.gravity;

  if (character.y >= 280) {
    character.y = 280;
    character.onGround = true;
  }
}

// Генерация препятствий
function generateObstacle() {
  obstacles.push({ x: canvas.width, y: 300, width: 40, height: 50 });
}

// Обновление препятствий
function updateObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= gameSpeed;

    if (obstacles[i].x + obstacles[i].width < 0) {
      obstacles.splice(i, 1);
      score++;
      document.getElementById("score").textContent = score;

      // Проверка на 15 очков и изменение фона/скорости
      if (score >= 10 && !isBackgroundChanged) {
        canvas.style.backgroundImage = "url('../img/levels/level_sq_2.webp')";
        gameSpeed = 6; // Увеличиваем скорость
        obstacleInterval = 900; // Уменьшаем интервал генерации
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

    // Обработка столкновений
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

// Функция завершения игры
function gameOver() {
  isGameOver = true;
  gameStarted = false;
  clearInterval(intervalId); // Очищаем интервал
  saveSessionStats(score); // Сохраняем результат
  drawGameOver(); // Отображаем экран завершения игры
}

// Функция рестарта игры
function resetGame() {
  isGameOver = false;
  gameStarted = false;
  showStats = true; // Переключаем в режим отображения статистики
  obstacles = [];
  score = 0;
  character = {
    x: 50,
    y: 280,
    width: 45,
    height: 70,
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

// Функция для получения статистики
function getSessionStats() {
  const stats = sessionStorage.getItem("gameStats");
  return stats ? JSON.parse(stats) : [];
}

// Функция для сохранения статистики
function saveSessionStats(score) {
  const stats = getSessionStats();
  stats.push(score);
  sessionStorage.setItem("gameStats", JSON.stringify(stats));
}

// Функция для отображения статистики
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

  // Надпись "Press R to continue"
  ctx.font = "30px 'Pixelify Sans', serif";
  ctx.fillText("Press R to restart", canvas.width / 2, canvas.height - 50);
}

// Функция отрисовки персонажа
function drawCharacter() {
  ctx.drawImage(characterImg, character.x, character.y, character.width, character.height);
}

// Экран завершения игры
function drawGameOver() {
  ctx.fillStyle = "#fff";
  ctx.font = "40px 'Pixelify Sans', serif";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 50);
  ctx.font = "30px 'Pixelify Sans', serif";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
  ctx.font = "30px 'Pixelify Sans', serif";
  ctx.fillText("Press R to continue", canvas.width / 2, canvas.height - 50);
}

// Игровой цикл
function gameLoop() {
  if (isGameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCharacter();
  updateCharacter();
  updateObstacles();
  requestAnimationFrame(gameLoop);
}

// Первоначальная отрисовка
drawStartScreen();