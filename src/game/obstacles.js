// src/game/obstacles.js

import obstacleSpritePath from '../assets/images/obstacles/obstacle.webp';

class ObstacleManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.obstacles = [];
    this.obstacleImg = new Image();
    this.obstacleImg.src = obstacleSpritePath;
    this.obstacleGenerationTimer = null;
    this.groundY = 300; // Фиксированная высота появления препятствий (уровень земли)
  }

  /**
   * Начинает генерацию препятствий с заданным интервалом.
   * @param {number} interval - Интервал в миллисекундах.
   */
  startGenerating(interval) {
    this.stopGenerating(); // Остановить предыдущий таймер, если он был
    this.generateObstacle(); // Сгенерировать одно сразу
    this.obstacleGenerationTimer = setInterval(() => this.generateObstacle(), interval);
  }

  /**
   * Останавливает генерацию препятствий.
   */
  stopGenerating() {
    if (this.obstacleGenerationTimer) {
      clearInterval(this.obstacleGenerationTimer);
      this.obstacleGenerationTimer = null;
    }
  }

  /**
   * Генерирует новое препятствие.
   */
  generateObstacle() {
    const minWidth = 30;
    const maxWidth = 60;
    const obstacleWidth = Math.floor(Math.random() * (maxWidth - minWidth + 1)) + minWidth;
    
    // Скорость препятствий может быть фиксированной или зависеть от уровня
    // В оригинальном коде скорость была случайной, но для предсказуемости лучше ее связать с gameSpeed уровня
    // const minSpeed = 4;
    // const maxSpeed = 8;
    // const obstacleSpeed = Math.floor(Math.random() * (maxSpeed - minSpeed + 1)) + minSpeed;
    // Пока оставим как было, но это кандидат на перенос в levelConfig

    this.obstacles.push({
      x: this.canvas.width,
      y: this.groundY, // Препятствия появляются на земле
      width: obstacleWidth,
      height: 50, // Фиксированная высота препятствия
      // speed: obstacleSpeed, // Используем gameSpeed из конфига уровня
    });
  }

  /**
   * Обновляет положение всех препятствий и удаляет те, что вышли за экран.
   * @param {number} gameSpeed - Текущая скорость игры (из настроек уровня).
   * @param {function} onObstaclePassed - Callback, вызываемый когда препятствие успешно пройдено.
   */
  update(gameSpeed, onObstaclePassed) {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= gameSpeed; // Двигаем препятствие в соответствии с общей скоростью игры

      if (obs.x + obs.width < 0) { // Если препятствие ушло за левый край
        this.obstacles.splice(i, 1);
        if (onObstaclePassed) {
          onObstaclePassed(); // Сообщаем, что препятствие пройдено (для увеличения счета)
        }
      }
    }
  }

  /**
   * Отрисовывает все активные препятствия.
   * @param {CanvasRenderingContext2D} ctx - Контекст рендеринга.
   */
  draw(ctx) {
    this.obstacles.forEach(obs => {
      ctx.drawImage(this.obstacleImg, obs.x, obs.y, obs.width, obs.height);
    });
  }

  /**
   * Очищает все препятствия.
   */
  reset() {
    this.obstacles = [];
    this.stopGenerating();
  }
}

export { ObstacleManager };
