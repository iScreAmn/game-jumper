document.fonts.ready.then(drawStartScreen);


// СОЗДАНИЕ CANVAS И КОНТЕКСТА 
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


canvas.width = 500;
canvas.height = 500;



// ЗАГРУЗКА ИЗОБРАЖЕНИЙ
const characterImg = new Image();
characterImg.src = "./img/person.webp";
characterImg.onload = () => console.log("Character loaded!");

const obstacleImg = new Image();
obstacleImg.src = "./img/obstracle.png";
obstacleImg.onload = () => console.log("Obstacle loaded!");


// СОЗДАНИЕ ПЕРЕМЕННЫХ
let character = {
  x: 50,
  y: 280,
  width: 80,
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

// ОТРИСОВКА ПЕРСОНАЖА
function drawCharacter() {
  ctx.drawImage(characterImg, character.x, character.y, character.width, character.height);
}

// ОТРИСОВКА СТАРТОВОГО ЭКРАНА

function drawStartScreen() {
  ctx.fillStyle = "#fff";
  ctx.font = "80px 'Pixelify Sans', serif";
  ctx.textAlign = "center";
  ctx.fillText("START", canvas.width / 2, canvas.height / 2 + 50);
}

// ПРЫЖОК

function jump() {
  if (character.onGround) {
    character.dy = character.jumpPower;
    character.onGround = false;
  }
}

// ОБНОВЛЕНИЕ ПЕРСОНАЖА (ГРАВИТАЦИЯ)

function updateCharacter() {
  character.y += character.dy;
  character.dy += character.gravity;

  if (character.y >= 280) {
    character.y = 280;
    character.onGround = true;
  }
}

// ГЕНЕРАЦИЯ ПРЕПЯТСТВИЙ

function generateObstacle() {
  obstacles.push({ x: canvas.width, y: 300, width: 40, height: 50 });
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
      character.x < obstacles[i].x + obstacles[i].width &&
      character.x + character.width > obstacles[i].x &&
      character.y < obstacles[i].y + obstacles[i].height &&
      character.y + character.height > obstacles[i].y
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
  drawCharacter();
  updateCharacter();
  updateObstacles();
  requestAnimationFrame(gameLoop);
}

//  ПОКАЗ СТАРТОВОГО ЭКРАНА

drawStartScreen();
