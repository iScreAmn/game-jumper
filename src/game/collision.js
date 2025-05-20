// src/game/collision.js

/**
 * Проверяет столкновение между двумя прямоугольными объектами.
 * @param {object} rect1 - Первый объект (например, игрок) с полями x, y, width, height.
 * @param {object} rect2 - Второй объект (например, препятствие) с полями x, y, width, height.
 * @returns {boolean} True, если объекты сталкиваются, иначе false.
 */
function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

export { checkCollision };
