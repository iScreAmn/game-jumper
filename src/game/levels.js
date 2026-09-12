import level1BgPath from '../assets/images/levels/level-1.webp';
import level2BgPath from '../assets/images/levels/level-2.webp';
import level3BgPath from '../assets/images/levels/level-3.webp';
import level4BgPath from '../assets/images/levels/level-4-demo.webp';
import { CANVAS } from './config.js';
import { levelIndexForScore } from './difficulty.js';
import { loadImage } from './assets.js';

// Визуальные уровни: фон холста и градиент страницы. Скорость от них не зависит,
// она растёт плавно по счёту (см. difficulty.js).
const LEVELS = [
  {
    background: level1BgPath,
    bodyGradient: 'linear-gradient(45deg, rgb(2, 0, 36) 0%, rgb(170, 0, 63) 52%, rgb(18, 33, 71) 100%)',
  },
  {
    background: level2BgPath,
    bodyGradient: 'linear-gradient(45deg, rgb(19, 0, 56) 0%, rgb(197, 9, 235) 52%, rgb(124, 91, 237) 100%)',
  },
  {
    background: level3BgPath,
    bodyGradient: 'linear-gradient(45deg, rgb(84, 176, 97) 0%, rgb(93, 210, 240) 46%, rgb(51, 126, 169) 100%)',
  },
  {
    background: level4BgPath,
    bodyGradient: 'linear-gradient(45deg, rgb(30, 6, 40) 0%, rgb(110, 30, 95) 52%, rgb(48, 20, 60) 100%)',
  },
];

const FADE_DURATION = 0.8; // с

/**
 * Рисует фон текущего уровня на холсте с плавным переходом между уровнями.
 * Раньше фон менялся через CSS, но background-image не анимируется.
 */
class LevelBackground {
  constructor() {
    this.images = LEVELS.map((level) => loadImage(level.background));
    this.currentIndex = 0;
    this.previousIndex = 0;
    this.fade = 1; // 1 = переход завершён
    this.applyBodyGradient();
  }

  get levelIndex() {
    return this.currentIndex;
  }

  reset() {
    this.setLevel(0, true);
  }

  /** Возвращает true, если уровень сменился. */
  syncWithScore(score) {
    const target = levelIndexForScore(score);
    if (target === this.currentIndex) return false;
    this.setLevel(target);
    return true;
  }

  setLevel(index, instant = false) {
    if (index === this.currentIndex && this.fade >= 1) return;
    this.previousIndex = this.currentIndex;
    this.currentIndex = index;
    this.fade = instant ? 1 : 0;
    this.applyBodyGradient();
  }

  applyBodyGradient() {
    if (typeof document === 'undefined') return;
    document.body.style.background = LEVELS[this.currentIndex].bodyGradient;
  }

  update(dt) {
    if (this.fade < 1) {
      this.fade = Math.min(1, this.fade + dt / FADE_DURATION);
    }
  }

  draw(ctx) {
    const current = this.images[this.currentIndex];
    const previous = this.images[this.previousIndex];

    if (this.fade < 1 && previous.complete) {
      ctx.drawImage(previous, 0, 0, CANVAS.width, CANVAS.height);
      ctx.save();
      ctx.globalAlpha = this.fade;
      if (current.complete) ctx.drawImage(current, 0, 0, CANVAS.width, CANVAS.height);
      ctx.restore();
    } else if (current.complete) {
      ctx.drawImage(current, 0, 0, CANVAS.width, CANVAS.height);
    }
  }
}

export { LEVELS, LevelBackground };
