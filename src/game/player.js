import amberSpritePath from '../assets/images/characters/character.webp';
import marioSpritePath from '../assets/images/characters/mario.webp';
import turtleSpritePath from '../assets/images/characters/turtle.webp';
import { GROUND_Y, PHYSICS, PLAYER } from './config.js';
import { loadImage } from './assets.js';

const CHARACTER_DEFINITIONS = [
  { name: 'Amber', src: amberSpritePath },
  { name: 'Mario', src: marioSpritePath },
  { name: 'Turtle', src: turtleSpritePath },
];

const SQUASH_DURATION = 0.16; // с, сплющивание после приземления

class Player {
  constructor() {
    this.x = PLAYER.x;
    this.hitbox = PLAYER.hitbox;

    // Все спрайты грузятся заранее, при выборе просто меняется ссылка.
    this.characters = CHARACTER_DEFINITIONS.map((def) => ({
      name: def.name,
      sprite: loadImage(def.src),
    }));
    this.selectedCharacterIndex = 0;

    // Слушатели событий для звука и эффектов: onLand(fallSpeed), onJump().
    this.onLand = null;
    this.onJump = null;

    this.reset();
  }

  get sprite() {
    return this.characters[this.selectedCharacterIndex].sprite;
  }

  /** Нижняя точка персонажа всегда на линии земли, когда он стоит. */
  get groundY() {
    return GROUND_Y - this.height;
  }

  selectCharacter(index) {
    if (index >= 0 && index < this.characters.length) {
      this.selectedCharacterIndex = index;
    }
  }

  reset() {
    this.width = PLAYER.width;
    this.height = PLAYER.height;
    this.hitbox = PLAYER.hitbox;
    this.y = GROUND_Y - this.height;
    this.dy = 0;
    this.onGround = true;
    this.ducking = false;
    this.duckHeld = false;
    this.runTime = 0;
    this.squashTimer = 0;
    this.fullJump = true; // false, если текущий прыжок был урезан ранним отпусканием
  }

  /** Начинает прыжок, если персонаж стоит на земле. Возвращает true при успехе. */
  jump() {
    if (!this.onGround) return false;
    if (this.ducking) this.setDucking(false);
    this.dy = PHYSICS.jumpVelocity;
    this.onGround = false;
    this.fullJump = true;
    this.onJump?.();
    return true;
  }

  /**
   * Досрочно гасит прыжок при отпускании кнопки: короткое нажатие даёт низкий прыжок.
   * Возвращает true, если прыжок действительно был урезан.
   */
  cutJump() {
    if (!this.onGround && this.dy < 0 && this.fullJump) {
      this.dy *= PHYSICS.jumpCutMultiplier;
      this.fullJump = false;
      return true;
    }
    return false;
  }

  /**
   * Нажатие «вниз»: на земле присед, в воздухе ускоренное падение.
   * Присед держится, пока кнопка удерживается.
   */
  duckDown() {
    this.duckHeld = true;
    if (this.onGround) {
      this.setDucking(true);
    } else if (this.dy < PHYSICS.fastFallVelocity) {
      this.dy = PHYSICS.fastFallVelocity;
    }
  }

  duckUp() {
    this.duckHeld = false;
    if (this.ducking) this.setDucking(false);
  }

  setDucking(ducking) {
    if (this.ducking === ducking) return;
    this.ducking = ducking;
    this.width = ducking ? PLAYER.duckWidth : PLAYER.width;
    this.height = ducking ? PLAYER.duckHeight : PLAYER.height;
    this.hitbox = ducking ? PLAYER.duckHitbox : PLAYER.hitbox;
    if (this.onGround) this.y = GROUND_Y - this.height;
  }

  /** @param {number} dt - время кадра в секундах */
  update(dt) {
    this.runTime += dt;
    if (this.squashTimer > 0) this.squashTimer = Math.max(0, this.squashTimer - dt);

    if (this.onGround) return;

    this.dy += PHYSICS.gravity * dt;
    this.y += this.dy * dt;

    if (this.y >= this.groundY) {
      const fallSpeed = this.dy;
      this.y = this.groundY;
      this.dy = 0;
      this.onGround = true;
      this.squashTimer = SQUASH_DURATION;
      if (this.duckHeld) this.setDucking(true);
      this.onLand?.(fallSpeed);
    }
  }

  /**
   * Процедурная анимация: покачивание при беге, вытягивание в прыжке,
   * сплющивание при приземлении и в приседе. Спрайт масштабируется
   * относительно нижней центральной точки, чтобы ноги оставались на земле.
   */
  draw(ctx) {
    if (!this.sprite.complete) return;

    let scaleX = 1;
    let scaleY = 1;
    let tilt = 0;
    let bob = 0;

    if (this.ducking) {
      scaleX = 1.05;
      scaleY = 1;
    } else if (!this.onGround) {
      const rising = this.dy < 0;
      const speedFactor = Math.min(1, Math.abs(this.dy) / Math.abs(PHYSICS.jumpVelocity));
      scaleX = 1 - 0.1 * speedFactor;
      scaleY = 1 + 0.12 * speedFactor;
      tilt = rising ? -0.08 : 0.06;
    } else {
      const squash = this.squashTimer / SQUASH_DURATION;
      scaleX = 1 + 0.22 * squash;
      scaleY = 1 - 0.22 * squash;
      bob = Math.abs(Math.sin(this.runTime * 14)) * 3;
      tilt = Math.sin(this.runTime * 14) * 0.03;
    }

    const baseWidth = PLAYER.width;
    const drawHeight = this.ducking ? PLAYER.duckHeight : PLAYER.height;
    const drawWidth = this.ducking ? PLAYER.duckWidth : baseWidth;

    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height - bob);
    ctx.rotate(tilt);
    ctx.scale(scaleX, scaleY);
    ctx.drawImage(this.sprite, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
    ctx.restore();
  }
}

export { Player, CHARACTER_DEFINITIONS };
