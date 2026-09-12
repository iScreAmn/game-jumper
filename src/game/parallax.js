import { CANVAS, GROUND_Y } from './config.js';
import { mulberry32 } from './random.js';

// Процедурный параллакс поверх статичного фона уровня.
// Три слоя движутся с разной скоростью, чтобы мир ощущался едущим:
// далёкие звёзды, угольки на средней дистанции и дорожка с камнями у земли.

const LAYERS = [
  { name: 'stars', factor: 0.12, count: 26, yRange: [20, 200], size: [1, 2], colors: ['#ffffff', '#cfd8ff', '#ffe9c4'] },
  { name: 'embers', factor: 0.4, count: 16, yRange: [180, 320], size: [2, 3], colors: ['#ff8c42', '#ffd166', '#ff5e3a'] },
  { name: 'rocks', factor: 1, count: 12, yRange: [GROUND_Y + 8, GROUND_Y + 40], size: [3, 7], colors: ['#1a1a2e', '#2b2b45', '#101020'] },
];

class Parallax {
  /** Раскладка слоёв детерминирована сидом, чтобы не менялась между кадрами. */
  constructor(seed = 7) {
    const random = mulberry32(seed);
    this.layers = LAYERS.map((layer) => ({
      ...layer,
      offset: 0,
      items: Array.from({ length: layer.count }, () => ({
        x: random() * CANVAS.width,
        y: layer.yRange[0] + random() * (layer.yRange[1] - layer.yRange[0]),
        size: layer.size[0] + random() * (layer.size[1] - layer.size[0]),
        color: layer.colors[Math.floor(random() * layer.colors.length)],
        phase: random() * Math.PI * 2,
      })),
    }));
    this.time = 0;
    this.groundOffset = 0;
  }

  reset() {
    for (const layer of this.layers) layer.offset = 0;
    this.groundOffset = 0;
  }

  /**
   * @param {number} dt
   * @param {number} worldSpeed - скорость мира в px/s
   */
  update(dt, worldSpeed) {
    this.time += dt;
    for (const layer of this.layers) {
      layer.offset = (layer.offset + worldSpeed * layer.factor * dt) % CANVAS.width;
    }
    this.groundOffset = (this.groundOffset + worldSpeed * dt) % 40;
  }

  /** Слои за игроком: звёзды и угольки. */
  drawBack(ctx) {
    this.drawLayer(ctx, this.layers[0], (item, x, y) => {
      const twinkle = 0.5 + 0.5 * Math.sin(this.time * 2 + item.phase);
      ctx.globalAlpha = 0.35 + 0.5 * twinkle;
      ctx.fillStyle = item.color;
      ctx.fillRect(Math.round(x), Math.round(y), item.size, item.size);
    });

    this.drawLayer(ctx, this.layers[1], (item, x, y) => {
      const drift = Math.sin(this.time * 1.5 + item.phase) * 6;
      ctx.globalAlpha = 0.55 + 0.3 * Math.sin(this.time * 4 + item.phase);
      ctx.fillStyle = item.color;
      ctx.fillRect(Math.round(x), Math.round(y + drift), item.size, item.size);
    });
    ctx.globalAlpha = 1;
  }

  /** Слой перед игроком у земли: линия горизонта, штрихи движения и камни. */
  drawFront(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(0, GROUND_Y, CANVAS.width, 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    for (let x = -this.groundOffset; x < CANVAS.width; x += 40) {
      ctx.fillRect(Math.round(x), GROUND_Y + 3, 18, 1);
    }

    this.drawLayer(ctx, this.layers[2], (item, x, y) => {
      ctx.fillStyle = item.color;
      ctx.fillRect(Math.round(x), Math.round(y), item.size, Math.max(2, item.size * 0.6));
    });
  }

  drawLayer(ctx, layer, drawItem) {
    for (const item of layer.items) {
      let x = item.x - layer.offset;
      if (x < -10) x += CANVAS.width;
      drawItem(item, x, item.y);
    }
  }
}

export { Parallax };
