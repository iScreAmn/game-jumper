import obstacleSpritePath from '../assets/images/obstacles/obstacle.webp';
import { CANVAS, GROUND_Y, OBSTACLE_HITBOX } from './config.js';
import { gapTimeRangeForScore, pickObstacleType } from './difficulty.js';
import { loadImage } from './assets.js';

// Сколько пикселей мир проезжает до первого препятствия после старта.
const INITIAL_SPAWN_DISTANCE = 250;

class ObstacleManager {
  constructor(random = Math.random) {
    this.random = random;
    this.obstacles = [];
    this.sprite = loadImage(obstacleSpritePath);
    this.time = 0;
    this.reset();
  }

  /** Подменяет источник случайности, например на сид дневного испытания. */
  setRandom(random) {
    this.random = random;
  }

  reset() {
    this.obstacles = [];
    this.currentSpeed = 0;
    // Расстояние, которое мир проехал с последнего спавна, и цель для следующего.
    this.distanceSinceSpawn = 0;
    this.nextSpawnDistance = INITIAL_SPAWN_DISTANCE;
    this.lastObstacleWidth = 0;
  }

  /** Создаёт препятствие у правого края холста. */
  spawn(score) {
    const type = pickObstacleType(score, this.random);
    const totalWidth = type.count * type.width + (type.count - 1) * (type.gap ?? 0);

    this.obstacles.push({
      type: type.name,
      x: CANVAS.width,
      y: GROUND_Y - type.altitude - type.height,
      width: totalWidth,
      height: type.height,
      altitude: type.altitude,
      flying: Boolean(type.flying),
      spriteWidth: type.width,
      count: type.count,
      gap: type.gap ?? 0,
      hitbox: OBSTACLE_HITBOX,
      bobPhase: this.random() * Math.PI * 2,
    });

    this.lastObstacleWidth = totalWidth;
    this.distanceSinceSpawn = 0;
    this.nextSpawnDistance = this.rollNextSpawnDistance(score);
  }

  /**
   * Следующий спавн происходит, когда мир проедет ширину предыдущего препятствия
   * плюс случайный интервал, выраженный в секундах пути. Поэтому зазор
   * всегда пропорционален скорости и остаётся перепрыгиваемым.
   */
  rollNextSpawnDistance(score) {
    const range = gapTimeRangeForScore(score);
    const gapTime = range.min + this.random() * (range.max - range.min);
    return this.lastObstacleWidth + gapTime * this.currentSpeed;
  }

  /**
   * Двигает препятствия, спавнит новые и удаляет ушедшие за экран.
   * @param {number} dt - время кадра в секундах
   * @param {number} speed - скорость мира в px/s
   * @param {number} score - текущий счёт, влияет на типы и интервалы
   * @param {(obstacle: object) => void} onPassed - вызывается, когда игрок обошёл препятствие
   */
  update(dt, speed, score, onPassed) {
    this.time += dt;
    this.currentSpeed = speed;
    const travelled = speed * dt;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= travelled;
      if (obs.x + obs.width < 0) {
        this.obstacles.splice(i, 1);
        onPassed?.(obs);
      }
    }

    this.distanceSinceSpawn += travelled;
    if (this.distanceSinceSpawn >= this.nextSpawnDistance) {
      this.spawn(score);
    }
  }

  draw(ctx) {
    if (!this.sprite.complete) return;
    for (const obs of this.obstacles) {
      // Летающие метеоры слегка покачиваются, чтобы читались как парящие.
      const bob = obs.flying ? Math.sin(this.time * 6 + obs.bobPhase) * 3 : 0;
      for (let i = 0; i < obs.count; i++) {
        const x = obs.x + i * (obs.spriteWidth + obs.gap);
        if (obs.flying) {
          // Летящий метеор рисуем перевёрнутым: хвост пламени тянется вверх.
          ctx.save();
          ctx.translate(x + obs.spriteWidth / 2, obs.y + obs.height / 2 + bob);
          ctx.rotate(Math.PI * 0.85);
          ctx.drawImage(this.sprite, -obs.spriteWidth / 2, -obs.height / 2, obs.spriteWidth, obs.height);
          ctx.restore();
        } else {
          ctx.drawImage(this.sprite, x, obs.y, obs.spriteWidth, obs.height);
        }
      }
    }
  }
}

export { ObstacleManager };
