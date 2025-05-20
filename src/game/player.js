
// Импорт спрайтов персонажей
import amberSpritePath from '../assets/images/characters/character.webp';
import marioSpritePath from '../assets/images/characters/mario.webp';
import turtleSpritePath from '../assets/images/characters/turtle.webp';

// Определения персонажей
const CHARACTER_DEFINITIONS = [
  { name: "Amber", src: amberSpritePath },
  { name: "Mario", src: marioSpritePath },
  { name: "Turtle", src: turtleSpritePath },
];

class Player {
  constructor(canvas) {
    this.canvas = canvas; // Ссылка на canvas для получения высоты земли, если нужно
    this.x = 50;
    this.y = 280; // Начальная позиция Y (земля)
    this.width = 45;
    this.height = 70;
    this.dy = 0; // Скорость по оси Y
    this.gravity = 0.5;
    this.jumpPower = -10.5; // Начальная сила прыжка, может меняться уровнем
    this.onGround = true;

    this.characters = CHARACTER_DEFINITIONS;
    this.selectedCharacterIndex = 0;
    this.characterImg = new Image();
    
    // Загрузка всех изображений персонажей заранее
    this.characterSprites = this.characters.map(charDef => {
        const img = new Image();
        img.src = charDef.src;
        return img;
    });
    this.characterImg.src = this.characterSprites[this.selectedCharacterIndex].src;

    this.groundY = 280; // Позиция земли
  }

  /**
   * Выбирает персонажа по индексу.
   * @param {number} index - Индекс выбранного персонажа.
   */
  selectCharacter(index) {
    if (index >= 0 && index < this.characterSprites.length) {
      this.selectedCharacterIndex = index;
      this.characterImg.src = this.characterSprites[this.selectedCharacterIndex].src;
    }
  }

  /**
   * Заставляет персонажа прыгнуть.
   */
  jump() {
    if (this.onGround) {
      this.dy = this.jumpPower;
      this.onGround = false;
    }
  }

  /**
   * Обновляет состояние персонажа (гравитация, положение).
   */
  update() {
    this.y += this.dy;
    this.dy += this.gravity;

    // Проверка столкновения с землей
    if (this.y >= this.groundY) {
      this.y = this.groundY;
      this.dy = 0;
      this.onGround = true;
    }
  }

  /**
   * Отрисовывает персонажа на холсте.
   * @param {CanvasRenderingContext2D} ctx - Контекст рендеринга холста.
   */
  draw(ctx) {
    ctx.drawImage(this.characterImg, this.x, this.y, this.width, this.height);
  }

  /**
   * Сбрасывает состояние персонажа к начальному.
   * @param {object} initialLevelConfig - Конфигурация начального уровня для установки jumpPower.
   */
  reset(initialLevelConfig) {
    this.y = this.groundY;
    this.dy = 0;
    this.onGround = true;
    this.jumpPower = initialLevelConfig.playerJumpPower;
    // Индекс выбранного персонажа сохраняется между играми,
    // но если нужно сбрасывать и его, добавь:
    // this.selectCharacter(0); 
  }

  /**
   * Возвращает массив определений персонажей для экрана выбора.
   * @returns {Array<object>} Массив с именами персонажей.
   */
  getCharacterDefinitionsForSelection() {
    return this.characters.map(charDef => ({
      name: charDef.name
    }));
  }
}

export { Player, CHARACTER_DEFINITIONS };
