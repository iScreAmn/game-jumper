
// СОЗДАНИЕ CANVAS И КОНТЕКСТА 

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


canvas.width = 500;
canvas.height = 500;



// ЗАГРУЗКА ИЗОБРАЖЕНИЙ

const horseImg = new Image();
horseImg.src = "./img/person.webp";
horseImg.onload = () => console.log("Horse loaded!");

const obstacleImg = new Image();
obstacleImg.src = "./img/obstracle.png";
obstacleImg.onload = () => console.log("Obstacle loaded!");


// СОЗДАНИЕ ПЕРЕМЕННЫХ

let horse = {
  x: 50,
  y: 280,
  width: 60,
  height: 60,
  dy: 0,
  gravity: 0.5,
  jumpPower: -10,
  onGround: true,
};

let obstacles = [];
let gameSpeed = 4;
let score = 0;
let gameStarted = false;

// ОТРИСОВКА ЛОШАДИ
function drawHorse() {
  ctx.drawImage(horseImg, horse.x, horse.y, horse.width, horse.height);
}

// ОТРИСОВКА СТАРТОВОГО ЭКРАНА

function drawStartScreen() {
  ctx.fillStyle = "black";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("START - Space Button", canvas.width / 2, canvas.height / 2);
}

// ПРЫЖОК

function jump() {
  if (horse.onGround) {
    horse.dy = horse.jumpPower;
    horse.onGround = false;
  }
}

// ОБНОВЛЕНИЕ ПЕРСОНАЖА (ГРАВИТАЦИЯ)

function updateHorse() {
  horse.y += horse.dy;
  horse.dy += horse.gravity;

  if (horse.y >= 280) {
    horse.y = 280;
    horse.onGround = true;
  }
}

// ГЕНЕРАЦИЯ ПРЕПЯТСТВИЙ

function generateObstacle() {
  obstacles.push({ x: canvas.width, y: 300, width: 20, height: 30 });
}

// ОБНОВЛЕНИЕ ПРЕПЯТСТВИЙ

function updateObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {  // Итерируем с конца, чтобы избежать проблем при splice()
    obstacles[i].x -= gameSpeed;

    if (obstacles[i].x + obstacles[i].width < 0) {
      obstacles.splice(i, 1);
      score++;
      document.getElementById("score").textContent = score;
      continue; // После удаления сразу переходим к следующей итерации
    }

    ctx.drawImage(
      obstacleImg,
      obstacles[i].x,
      obstacles[i].y,
      obstacles[i].width,
      obstacles[i].height
    );


  // ПРОВЕРКА СТОЛКНОВЕНИЯ  
    if (
      horse.x < obstacles[i].x + obstacles[i].width &&
      horse.x + horse.width > obstacles[i].x &&
      horse.y < obstacles[i].y + obstacles[i].height &&
      horse.y + horse.height > obstacles[i].y
    ) {
      // alert("Game Over! Score: " + score);
      location.reload();
    }
  }
}

// ОБРАБОТЧИК НАЖАТИЯ КЛАВИШИ (СТАРТ И ПРЫЖОК)

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (!gameStarted) {
      gameStarted = true;
      gameLoop();
      setInterval(generateObstacle, 2000);
    }
    jump();
  }
});

// ГЛАВНЫЙ ИГРОВОЙ ЦИКЛ

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawHorse();
  updateHorse();
  updateObstacles();
  requestAnimationFrame(gameLoop);
}

//  ПОКАЗ СТАРТОВОГО ЭКРАНА

drawStartScreen();
