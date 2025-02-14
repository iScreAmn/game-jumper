document.fonts.ready.then(drawStartScreen);

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 500;
canvas.height = 500;

// Добавлено: переменные для управления состоянием игры
let isGameOver = false;
let intervalId = null;

const characterImg = new Image();
characterImg.src = "./img/person.webp";
characterImg.onload = () => console.log("Character loaded!");

const obstacleImg = new Image();
obstacleImg.src = "./img/obstracle.png";
obstacleImg.onload = () => console.log("Obstacle loaded!");

let character = {
  x: 50,
  y: 280,
  width: 70,
  height: 80,
  dy: 0,
  gravity: 0.5,
  jumpPower: -12,
  onGround: true,
};

let obstacles = [];
let gameSpeed = 4;
let score = 0;
let gameStarted = false;

function drawCharacter() {
  ctx.drawImage(characterImg, character.x, character.y, character.width, character.height);
}

function drawStartScreen() {
  ctx.fillStyle = "#fff";
  ctx.font = "80px 'Pixelify Sans', serif";
  ctx.textAlign = "center";
  ctx.fillText("START", canvas.width / 2, canvas.height / 2 + 50);
}

// Добавлено: экран завершения игры
function drawGameOver() {
  ctx.fillStyle = "#fff";
  ctx.font = "40px 'Pixelify Sans', serif";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
  ctx.fillText("Press R to restart", canvas.width / 2, canvas.height / 2 + 40);
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

// Добавлено: функция завершения игры
function gameOver() {
  isGameOver = true;
  gameStarted = false;
  clearInterval(intervalId);
  drawGameOver();
}

// Добавлено: функция рестарта игры
function resetGame() {
  isGameOver = false;
  gameStarted = false;
  obstacles = [];
  score = 0;
  character = {
    x: 50,
    y: 280,
    width: 70,
    height: 80,
    dy: 0,
    gravity: 0.5,
    jumpPower: -12,
    onGround: true,
  };
  document.getElementById("score").textContent = "0";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStartScreen();
}

// Изменено: обработчик клавиш
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (!gameStarted && !isGameOver) {
      gameStarted = true;
      intervalId = setInterval(generateObstacle, 2000);
      gameLoop();
    }
    jump();
  }
  
  if (e.code === "KeyR" && isGameOver) {
    resetGame();
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