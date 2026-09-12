/**
 * Создаёт объект изображения и запускает загрузку.
 * В окружении без DOM (тесты) возвращает заглушку с тем же интерфейсом,
 * чтобы модули с ассетами можно было импортировать в Node.
 */
function loadImage(src) {
  if (typeof Image === 'undefined') {
    return { src, complete: false, width: 0, height: 0 };
  }
  const img = new Image();
  img.src = src;
  return img;
}

export { loadImage };
