import { CANVAS, EFFECTS } from './config.js';

// Экранные эффекты: тряска, hit-stop, всплывающий текст, вспышка уровня, тосты.
// Всё уважает prefers-reduced-motion: тряска и вспышки отключаются.

class Effects {
  constructor({ reducedMotion = false } = {}) {
    this.reducedMotion = reducedMotion;
    this.reset();
  }

  reset() {
    this.shakeTime = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.hitStopTime = 0;
    this.flashTime = 0;
    this.flashLabel = '';
    this.floatingTexts = [];
    this.toasts = [];
    this.time = 0;
  }

  /** Пока идёт hit-stop, мир не обновляется. */
  get frozen() {
    return this.hitStopTime > 0;
  }

  shake(intensity, duration) {
    if (this.reducedMotion) return;
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  hitStop(duration = EFFECTS.hitStop) {
    this.hitStopTime = Math.max(this.hitStopTime, duration);
  }

  levelFlash(label) {
    this.flashLabel = label;
    this.flashTime = EFFECTS.levelFlash;
  }

  floatText(text, x, y, color = '#fff') {
    this.floatingTexts.push({ text, x, y, color, life: 0.8, maxLife: 0.8 });
  }

  /** Уведомление в верхней части экрана, например об открытом достижении. */
  toast(title, subtitle = '') {
    this.toasts.push({ title, subtitle, life: 2.6, maxLife: 2.6 });
  }

  update(dt) {
    this.time += dt;
    if (this.hitStopTime > 0) this.hitStopTime = Math.max(0, this.hitStopTime - dt);
    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
      if (this.shakeTime === 0) {
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
      }
    }
    if (this.flashTime > 0) this.flashTime = Math.max(0, this.flashTime - dt);

    for (const ft of this.floatingTexts) {
      ft.life -= dt;
      ft.y -= 40 * dt;
    }
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.life > 0);

    for (const toast of this.toasts) toast.life -= dt;
    this.toasts = this.toasts.filter((t) => t.life > 0);
  }

  /** Смещение холста для тряски в текущем кадре. */
  get shakeOffset() {
    if (this.shakeTime <= 0 || this.shakeDuration <= 0) return { x: 0, y: 0 };
    const falloff = this.shakeTime / this.shakeDuration;
    const amplitude = this.shakeIntensity * falloff;
    return {
      x: Math.sin(this.time * 97) * amplitude,
      y: Math.cos(this.time * 83) * amplitude,
    };
  }

  /** Рисует эффекты поверх мира: всплывающий текст и вспышку уровня. */
  drawWorldOverlay(ctx, font) {
    for (const ft of this.floatingTexts) {
      const t = ft.life / ft.maxLife;
      ctx.globalAlpha = Math.min(1, t * 2);
      ctx.font = `22px ${font}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;

    if (this.flashTime > 0) {
      const t = this.flashTime / EFFECTS.levelFlash;
      if (!this.reducedMotion) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.35 * t})`;
        ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
      }
      ctx.globalAlpha = Math.min(1, t * 1.5);
      ctx.font = `48px ${font}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe066';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 8;
      ctx.fillText(this.flashLabel, CANVAS.width / 2, CANVAS.height / 2 - 40 - (1 - t) * 20);
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.globalAlpha = 1;
    }
  }

  /** Рисует тосты поверх интерфейса. Только первый активен, остальные ждут. */
  drawToasts(ctx, font) {
    const toast = this.toasts[0];
    if (!toast) return;
    const elapsed = toast.maxLife - toast.life;
    const slideIn = Math.min(1, elapsed / 0.25);
    const fadeOut = Math.min(1, toast.life / 0.3);
    const y = -50 + 130 * slideIn;

    ctx.globalAlpha = fadeOut;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    const w = 320;
    const h = toast.subtitle ? 58 : 40;
    const x = (CANVAS.width - w) / 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe066';
    ctx.font = `20px ${font}`;
    ctx.fillText(toast.title, CANVAS.width / 2, y + 26);
    if (toast.subtitle) {
      ctx.fillStyle = '#fff';
      ctx.font = `16px ${font}`;
      ctx.fillText(toast.subtitle, CANVAS.width / 2, y + 47);
    }
    ctx.globalAlpha = 1;
  }
}

export { Effects };
