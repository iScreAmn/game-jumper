import { checkCollision, getHitbox, rectsIntersect } from './collision.js';
import { speedForScore } from './difficulty.js';
import { evaluateAchievements } from './achievements.js';
import { EFFECTS } from './config.js';

// Сколько искр в секунду сыплется с каждого метеора.
const SPARKS_PER_SECOND = 10;

/**
 * Одна игровая сессия: игрок, препятствия, счёт, столкновения, эффекты.
 * Не знает про requestAnimationFrame и экраны, только update(dt) и draw(ctx).
 */
class Game {
  constructor({ player, obstacles, background, audio, particles, effects, parallax }) {
    this.player = player;
    this.obstacles = obstacles;
    this.background = background;
    this.audio = audio;
    this.particles = particles;
    this.effects = effects;
    this.parallax = parallax;

    // Вызывается с объектом достижения, когда оно открыто в этом забеге.
    this.onAchievement = null;

    this.player.onLand = (fallSpeed) => this.handleLanding(fallSpeed);
    this.player.onJump = () => this.handleJump();

    this.score = 0;
    this.isOver = false;
    this.timeSinceOver = 0;
    this.mode = 'endless';
    this.stats = this.createStats();
    this.unlockedIds = [];
    this.deathEffectsPlayed = false;
  }

  createStats() {
    return { ducked: 0, cutJumps: 0, charactersPlayed: [] };
  }

  /**
   * @param {object} [opts]
   * @param {'endless'|'daily'} [opts.mode]
   * @param {() => number} [opts.random] - источник случайности для препятствий
   * @param {string[]} [opts.unlockedIds] - уже открытые достижения
   * @param {number[]} [opts.charactersPlayed] - персонажи, которыми играли когда-либо
   */
  start({ mode = 'endless', random = Math.random, unlockedIds = [], charactersPlayed = [] } = {}) {
    this.score = 0;
    this.isOver = false;
    this.timeSinceOver = 0;
    this.mode = mode;
    this.unlockedIds = [...unlockedIds];
    this.stats = { ...this.createStats(), charactersPlayed: [...charactersPlayed] };
    this.deathEffectsPlayed = false;

    this.obstacles.setRandom(random);
    this.player.reset();
    this.obstacles.reset();
    this.background.reset();
    this.particles.reset();
    this.effects.reset();
    this.parallax.reset();
  }

  get speed() {
    return speedForScore(this.score);
  }

  /** @param {number} dt - время кадра в секундах */
  update(dt) {
    this.effects.update(dt);

    if (this.isOver) {
      this.timeSinceOver += dt;
      if (this.effects.frozen) return;
      if (!this.deathEffectsPlayed) {
        this.deathEffectsPlayed = true;
        this.effects.shake(EFFECTS.deathShake.intensity, EFFECTS.deathShake.duration);
      }
      this.particles.update(dt, 0);
      return;
    }

    const speed = this.speed;
    this.player.update(dt);
    this.obstacles.update(dt, speed, this.score, (obs) => this.onObstaclePassed(obs));
    this.parallax.update(dt, speed);
    this.particles.update(dt, speed);
    this.emitSparks(dt);
    this.trackDucking();

    for (const obstacle of this.obstacles.obstacles) {
      if (checkCollision(this.player, obstacle)) {
        this.die(obstacle);
        break;
      }
    }
  }

  emitSparks(dt) {
    for (const obs of this.obstacles.obstacles) {
      if (Math.random() < SPARKS_PER_SECOND * dt) {
        const x = obs.x + Math.random() * obs.width;
        this.particles.meteorSparks(x, obs.y + 6);
      }
    }
  }

  /** Отмечает низкие метеоры, под которыми игрок пригнулся, для достижения. */
  trackDucking() {
    if (!this.player.ducking) return;
    const playerBox = getHitbox(this.player, this.player.hitbox);
    for (const obs of this.obstacles.obstacles) {
      if (obs.type !== 'flyLow' || obs.duckedUnder) continue;
      const column = { x: obs.x, y: 0, width: obs.width, height: 1000 };
      if (rectsIntersect(playerBox, column)) obs.duckedUnder = true;
    }
  }

  die(obstacle) {
    this.isOver = true;
    this.audio.playHit();
    this.effects.hitStop();
    const cx = Math.max(this.player.x, obstacle.x) + Math.min(this.player.width, obstacle.width) / 2;
    const cy = obstacle.y + obstacle.height / 2;
    this.particles.explosion(cx, cy);
    this.checkAchievements(true);
  }

  onObstaclePassed(obs) {
    this.score += 1;
    if (obs.duckedUnder) this.stats.ducked += 1;
    this.effects.floatText('+1', this.player.x + this.player.width / 2, this.player.y - 10, '#ffe066');

    if (this.background.syncWithScore(this.score)) {
      this.audio.playLevelUp();
      this.effects.levelFlash(`LEVEL ${this.background.levelIndex + 1}`);
    }
    this.checkAchievements(false);
  }

  checkAchievements(finished) {
    const snapshot = {
      score: this.score,
      levelIndex: this.background.levelIndex,
      ducked: this.stats.ducked,
      cutJumps: this.stats.cutJumps,
      charactersPlayed: this.stats.charactersPlayed,
      mode: this.mode,
      finished,
    };
    const fresh = evaluateAchievements(snapshot, this.unlockedIds);
    for (const achievement of fresh) {
      this.unlockedIds.push(achievement.id);
      this.onAchievement?.(achievement);
    }
  }

  handleJump() {
    this.audio.playJump();
    this.particles.landingDust(this.player.x + this.player.width / 2, this.player.y + this.player.height, 0.5);
  }

  handleLanding(fallSpeed) {
    const strength = Math.min(1.5, fallSpeed / 700);
    this.particles.landingDust(this.player.x + this.player.width / 2, this.player.y + this.player.height, strength);
    if (strength > 1.1) this.effects.shake(EFFECTS.landShake.intensity, EFFECTS.landShake.duration);
  }

  jump() {
    if (this.isOver) return;
    this.player.jump();
  }

  cutJump() {
    if (this.isOver) return;
    if (this.player.cutJump()) this.stats.cutJumps += 1;
  }

  duckDown() {
    if (this.isOver) return;
    this.player.duckDown();
  }

  duckUp() {
    this.player.duckUp();
  }

  /** Рисует мир: препятствия, игрока, частицы и наложения эффектов. */
  draw(ctx, font) {
    this.obstacles.draw(ctx);
    this.player.draw(ctx);
    this.particles.draw(ctx);
    this.effects.drawWorldOverlay(ctx, font);
  }
}

export { Game };
