// src/game/gameLoop.js

import { checkCollision } from './collision.js';
import { updateLevel, getCurrentLevelConfig } from './levels.js';

class GameLoop {
  constructor(canvas, ctx, player, obstacleManager, uiManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.player = player;
    this.obstacleManager = obstacleManager;
    this.uiManager = uiManager; // Для обновления счета и вызова gameOver экрана

    this.isGameOver = false;
    this.score = 0;
    this.animationFrameId = null;

    // Привязываем методы к экземпляру класса, чтобы this работал корректно в requestAnimationFrame
    this.loop = this.loop.bind(this);
  }

  /**
   * Запускает игровой цикл.
   */
  start() {
    this.isGameOver = false;
    this.score = 0;
    this.uiManager.updateScoreDisplay(this.score); // Обновить отображение счета
    
    const initialLevelConfig = getCurrentLevelConfig();
    this.player.reset(initialLevelConfig); // Сброс игрока с учетом настроек уровня
    this.obstacleManager.reset(); // Сброс препятствий
    this.obstacleManager.startGenerating(initialLevelConfig.obstacleInterval);

    // Убедимся, что настройки уровня применены (особенно фон)
    // Это может быть уже сделано в main.js при resetLevels, но для надежности
    // import { applyLevelSettings } from './levels.js';
    // applyLevelSettings(this.canvas);


    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.loop();
  }

  /**
   * Останавливает игровой цикл.
   */
  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.obstacleManager.stopGenerating();
  }

  /**
   * Основная функция игрового цикла.
   */
  loop() {
    if (this.isGameOver) {
      this.stop();
      this.uiManager.showGameOverScreen(this.score);
      return;
    }

    // Получаем текущую конфигурацию уровня для скорости и других параметров
    const currentConfig = getCurrentLevelConfig();

    // Обновление состояния игры
    this.player.update();
    this.obstacleManager.update(currentConfig.gameSpeed, () => {
      // Callback, когда препятствие пройдено
      this.score++;
      this.uiManager.updateScoreDisplay(this.score);

      // Проверка и обновление уровня
      const levelChanged = updateLevel(this.score, this.canvas, this.player);
      if (levelChanged) {
          // Если уровень изменился, нужно обновить интервал генерации препятствий
          const newConfig = getCurrentLevelConfig();
          this.obstacleManager.startGenerating(newConfig.obstacleInterval);
          this.player.jumpPower = newConfig.playerJumpPower; // Обновляем силу прыжка
      }
    });

    // Проверка столкновений
    for (const obstacle of this.obstacleManager.obstacles) {
      if (checkCollision(this.player, obstacle)) {
        this.isGameOver = true;
        // Звук столкновения или другие эффекты можно добавить здесь
        break; 
      }
    }

    // Отрисовка
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.player.draw(this.ctx);
    this.obstacleManager.draw(this.ctx);

    // Запрос следующего кадра
    this.animationFrameId = requestAnimationFrame(this.loop);
  }
}

export { GameLoop };
