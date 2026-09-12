import { checkCollision } from './collision.js';
import { speedForScore } from './difficulty.js';

/**
 * Одна игровая сессия: игрок, препятствия, счёт, столкновения.
 * Не знает про requestAnimationFrame и экраны, только update(dt) и draw(ctx).
 */
class Game {
  constructor({ player, obstacles, background, audio }) {
    this.player = player;
    this.obstacles = obstacles;
    this.background = background;
    this.audio = audio;

    this.score = 0;
    this.isOver = false;
    this.timeSinceOver = 0;
  }

  start() {
    this.score = 0;
    this.isOver = false;
    this.timeSinceOver = 0;
    this.player.reset();
    this.obstacles.reset();
    this.background.reset();
  }

  get speed() {
    return speedForScore(this.score);
  }

  /** @param {number} dt - время кадра в секундах */
  update(dt) {
    if (this.isOver) {
      this.timeSinceOver += dt;
      return;
    }

    this.player.update(dt);
    this.obstacles.update(dt, this.speed, this.score, () => this.onObstaclePassed());

    for (const obstacle of this.obstacles.obstacles) {
      if (checkCollision(this.player, obstacle)) {
        this.isOver = true;
        this.audio.playHit();
        break;
      }
    }
  }

  onObstaclePassed() {
    this.score += 1;
    if (this.background.syncWithScore(this.score)) {
      this.audio.playLevelUp();
    }
  }

  jump() {
    if (this.isOver) return;
    if (this.player.jump()) this.audio.playJump();
  }

  cutJump() {
    this.player.cutJump();
  }

  draw(ctx) {
    this.obstacles.draw(ctx);
    this.player.draw(ctx);
  }
}

export { Game };
