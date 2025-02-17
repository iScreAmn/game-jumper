const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 500;
canvas.height = 500;

// Устанавливаем начальный фон
canvas.style.backgroundImage = "url('../img/levels/level-1.webp')";

// Состояния игры
let isGameOver = false;
let intervalId = null;
let showStats = false;
let isBackgroundChanged = false;
let isSecondLevelChanged = false; // Флаг для второго уровня

// Персонажи
const characters = [
  { name: "Amber", src: "./img/characters/character.webp" },
  { name: "Mario", src: "./img/characters/mario.webp" },
  { name: "Turtle", src: "./img/characters/turtle.webp" },
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
  jumpPower: -10.5,
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
  }).catch(error => {
    console.error("Font load error:", error);
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
        characterImg.src = characters[selectedCharacterIndex].src;
        gameStarted = true;
        intervalId = setInterval(generateObstacle, 2000);
        gameLoop();
        break;
    }
  }

  // Обработка прыжка
  if (e.code === "Space") {
    if (!gameStarted && !isGameOver) {
      gameStarted = true;
      intervalId = setInterval(generateObstacle, 2000);
      gameLoop();
    } else if (gameStarted && !isGameOver) {
      jump();
    }
  }

  // Обработка рестарта
  if (e.code === "KeyR") {
    if (isGameOver && !showStats) {
      resetGame();
    } else if (showStats) {
      showStats = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawStartScreen();
      obstacles = [];
      score = 0;
      gameSpeed = 4;
      isBackgroundChanged = false;
      isSecondLevelChanged = false; // Сбрасываем флаг второго уровня
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

// Генерация случайных препятствий (только на уровне земли)
function generateObstacle() {
  const obstacleWidth = Math.floor(Math.random() * (60 - 30 + 1)) + 30;
  const obstacleSpeed = Math.floor(Math.random() * (8 - 4 + 1)) + 4;
  const obstacleY = 300; // Фиксированная высота (уровень земли)

  obstacles.push({
    x: canvas.width,
    y: obstacleY,
    width: obstacleWidth,
    height: 50, // Фиксированная высота
    speed: obstacleSpeed,
  });
}

// Обновление препятствий
function updateObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= obstacles[i].speed;

    if (obstacles[i].x + obstacles[i].width < 0) {
      obstacles.splice(i, 1);
      score++;
      document.getElementById("score").textContent = score;

      // Настройка первого уровня (5 очков)
      if (score >= 1 && !isBackgroundChanged) {
        canvas.style.backgroundImage = "url('../img/levels/level-2.webp')";
        gameSpeed = 4;
        obstacleInterval = 1200;
        clearInterval(intervalId);
        intervalId = setInterval(generateObstacle, obstacleInterval);
        isBackgroundChanged = true;
      }

      // Настройка второго уровня (15 очков)
      if (score >= 2 && !isSecondLevelChanged) {
        canvas.style.backgroundImage = "url('../img/levels/level-3-demo.webp')"; // Новый фон
        gameSpeed = 4.5; // Увеличиваем скорость
        obstacleInterval = 1000; // Уменьшаем интервал генерации
        clearInterval(intervalId);
        intervalId = setInterval(generateObstacle, obstacleInterval);
        isSecondLevelChanged = true; // Флаг, чтобы изменения произошли только один раз
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
  clearInterval(intervalId);
  saveSessionStats(score);
  drawGameOver();
}

// Функция рестарта игры
function resetGame() {
  isGameOver = false;
  gameStarted = false;
  showStats = true;
  obstacles = [];
  score = 0;
  character = {
    x: 50,
    y: 280,
    width: 45,
    height: 70,
    dy: 0,
    gravity: 0.5,
    jumpPower: -10.5,
    onGround: true,
  };
  document.getElementById("score").textContent = "0";
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Сбрасываем фон и скорость
  canvas.style.backgroundImage = "url('../img/levels/level-1.webp')";
  gameSpeed = 4;
  isBackgroundChanged = false;
  isSecondLevelChanged = false; // Сбрасываем флаг второго уровня

  if (showStats) {
    drawStats();
  } else {
    drawStartScreen();
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

  const bestScore = Math.max(...stats);
  ctx.fillText(`Best Score: ${bestScore}`, canvas.width / 2, canvas.height / 2 - 70);

  const recentGames = stats.slice(-5).reverse();
  ctx.fillText("Recent Jumps:", canvas.width / 2, canvas.height / 2 - 30);
  recentGames.forEach((gameScore, index) => {
    ctx.fillText(`Game ${index + 1}: ${gameScore}`, canvas.width / 2, canvas.height / 2 + index * 30);
  });

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
  ctx.font = "70px 'Pixelify Sans', serif";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 + 20);
  ctx.font = "30px 'Pixelify Sans', serif";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 4);
  ctx.font = "30px 'Pixelify Sans', serif";
  ctx.fillText("Press R to continue...", canvas.width / 2, canvas.height - 50);
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