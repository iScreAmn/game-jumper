/**
 * Возвращает прямоугольник хитбокса объекта с учётом внутренних отступов.
 * @param {{x:number,y:number,width:number,height:number}} rect
 * @param {{left:number,right:number,top:number,bottom:number}} [inset]
 */
function getHitbox(rect, inset = { left: 0, right: 0, top: 0, bottom: 0 }) {
  return {
    x: rect.x + inset.left,
    y: rect.y + inset.top,
    width: Math.max(0, rect.width - inset.left - inset.right),
    height: Math.max(0, rect.height - inset.top - inset.bottom),
  };
}

/**
 * Проверяет пересечение двух прямоугольников (AABB).
 * @returns {boolean} True, если прямоугольники пересекаются.
 */
function rectsIntersect(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Проверяет столкновение двух объектов по их хитбоксам.
 * Каждый объект может иметь поле hitbox с отступами внутрь спрайта.
 */
function checkCollision(a, b) {
  return rectsIntersect(getHitbox(a, a.hitbox), getHitbox(b, b.hitbox));
}

export { getHitbox, rectsIntersect, checkCollision };
