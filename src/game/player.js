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

class Player {
  constructor() {
    this.x = PLAYER.x;
    this.width = PLAYER.width;
    this.height = PLAYER.height;
    this.hitbox = PLAYER.hitbox;
    this.groundY = GROUND_Y - this.height;
    this.y = this.groundY;
    this.dy = 0;
    this.onGround = true;

    // Все спрайты грузятся заранее, при выборе просто меняется ссылка.
    this.characters = CHARACTER_DEFINITIONS.map((def) => ({
      name: def.name,
      sprite: loadImage(def.src),
    }));
    this.selectedCharacterIndex = 0;
  }

  get sprite() {
    return this.characters[this.selectedCharacterIndex].sprite;
  }

  selectCharacter(index) {
    if (index >= 0 && index < this.characters.length) {
      this.selectedCharacterIndex = index;
    }
  }

  /** Начинает прыжок, если персонаж стоит на земле. Возвращает true при успехе. */
  jump() {
    if (!this.onGround) return false;
    this.dy = PHYSICS.jumpVelocity;
    this.onGround = false;
    return true;
  }

  /** Досрочно гасит прыжок при отпускании кнопки: короткое нажатие даёт низкий прыжок. */
  cutJump() {
    if (!this.onGround && this.dy < 0) {
      this.dy *= PHYSICS.jumpCutMultiplier;
    }
  }

  /** @param {number} dt - время кадра в секундах */
  update(dt) {
    this.dy += PHYSICS.gravity * dt;
    this.y += this.dy * dt;

    if (this.y >= this.groundY) {
      this.y = this.groundY;
      this.dy = 0;
      this.onGround = true;
    }
  }

  draw(ctx) {
    if (!this.sprite.complete) return;
    ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
  }

  reset() {
    this.y = this.groundY;
    this.dy = 0;
    this.onGround = true;
  }
}

export { Player, CHARACTER_DEFINITIONS };
