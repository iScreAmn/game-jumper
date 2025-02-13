
// СОЗДАНИЕ CANVAS И КОНТЕКСТА 

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 500;
canvas.height = 500;



// ЗАГРУЗКА ИЗОБРАЖЕНИЙ

const horseImg = new Image();
horseImg.src = "./person.webp";
horseImg.onload = () => console.log("Horse loaded!");

const obstacleImg = new Image();
obstacleImg.src = "./obstracle.png";
obstacleImg.onload = () => console.log("Obstacle loaded!");


// СОЗДАНИЕ ПЕРЕМЕННЫХ

let horse = {
  x: 50,
  y: 280,
  width: 60,
  height: 60,
  dy: 0,
  gravity: 0.4,
  jumpPower: -10,
  onGround: true,
};

let obstacles = [];
let gameSpeed = 3;
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

// ОБНОВЛЕНИЕ ЛОШАДИ (ГРАВИТАЦИЯ)
function updateHorse() {
  horse.y += horse.dy;
  horse.dy += horse.gravity;

  if (horse.y >= 280) {
    horse.y = 280;
    horse.onGround = true;
  }
}
