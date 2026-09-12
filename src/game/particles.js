// Лёгкая система частиц для пыли, искр и взрывов.
// Частицы хранятся в одном массиве и переиспользуются по мере затухания.

const MAX_PARTICLES = 400;

class ParticleSystem {
  constructor(random = Math.random) {
    this.random = random;
    this.particles = [];
    this.enabled = true;
  }

  reset() {
    this.particles = [];
  }

  /**
   * Испускает пачку частиц.
   * @param {object} opts
   * @param {number} opts.x
   * @param {number} opts.y
   * @param {number} opts.count
   * @param {number[]} opts.speed - [min, max] px/s
   * @param {number[]} opts.angle - [from, to] радианы, 0 вправо, отрицательные вверх
   * @param {number[]} opts.life - [min, max] секунд
   * @param {number[]} opts.size - [min, max] px
   * @param {string[]} opts.colors
   * @param {number} [opts.gravity] - px/s²
   * @param {number} [opts.drag] - доля скорости, теряемая за секунду
   * @param {number} [opts.spread] - разброс стартовой позиции, px
   */
  emit({ x, y, count, speed, angle, life, size, colors, gravity = 0, drag = 0, spread = 0 }) {
    if (!this.enabled) return;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) this.particles.shift();
      const a = this.lerp(angle[0], angle[1]);
      const v = this.lerp(speed[0], speed[1]);
      const maxLife = this.lerp(life[0], life[1]);
      this.particles.push({
        x: x + (this.random() - 0.5) * spread,
        y: y + (this.random() - 0.5) * spread,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: maxLife,
        maxLife,
        size: this.lerp(size[0], size[1]),
        color: colors[Math.floor(this.random() * colors.length)],
        gravity,
        drag,
      });
    }
  }

  lerp(min, max) {
    return min + this.random() * (max - min);
  }

  /**
   * @param {number} dt
   * @param {number} worldSpeed - скорость мира: частицы на земле уезжают влево вместе с ним
   */
  update(dt, worldSpeed = 0) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      if (p.drag) {
        const keep = Math.max(0, 1 - p.drag * dt);
        p.vx *= keep;
        p.vy *= keep;
      }
      p.x += (p.vx - worldSpeed) * dt;
      p.y += p.vy * dt;
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      const t = p.life / p.maxLife;
      ctx.globalAlpha = Math.min(1, t * 1.5);
      ctx.fillStyle = p.color;
      const s = p.size * (0.4 + 0.6 * t);
      ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), Math.ceil(s), Math.ceil(s));
    }
    ctx.globalAlpha = 1;
  }

  // --- Готовые эффекты ---

  landingDust(x, y, strength = 1) {
    this.emit({
      x,
      y,
      count: Math.round(6 + 6 * strength),
      speed: [40, 140 * strength],
      angle: [Math.PI * 1.05, Math.PI * 1.95],
      life: [0.25, 0.5],
      size: [2, 5],
      colors: ['#e8e2d6', '#c9c2b5', '#a89f92'],
      gravity: 300,
      drag: 2,
      spread: 14,
    });
  }

  meteorSparks(x, y) {
    this.emit({
      x,
      y,
      count: 1,
      speed: [20, 70],
      angle: [-Math.PI * 0.75, -Math.PI * 0.25],
      life: [0.3, 0.7],
      size: [2, 4],
      colors: ['#ffd166', '#ff8c42', '#ff5e3a'],
      gravity: -60,
      spread: 10,
    });
  }

  explosion(x, y) {
    this.emit({
      x,
      y,
      count: 60,
      speed: [120, 420],
      angle: [0, Math.PI * 2],
      life: [0.4, 0.9],
      size: [3, 8],
      colors: ['#ffd166', '#ff8c42', '#ff3b30', '#ffffff'],
      gravity: 500,
      drag: 1.2,
      spread: 20,
    });
  }
}

export { ParticleSystem };
