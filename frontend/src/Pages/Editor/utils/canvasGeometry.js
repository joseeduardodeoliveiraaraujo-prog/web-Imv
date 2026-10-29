export const getBoxRect = (x, y, width, height) => ({
  x: x - width / 2,
  y,
  w: width,
  h: height,
});

export const isInsideRect = (mouseX, mouseY, box) =>
  mouseX >= box.x &&
  mouseX <= box.x + box.w &&
  mouseY >= box.y &&
  mouseY <= box.y + box.h;
