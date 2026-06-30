/**
 * Fills the whole canvas with a solid color, gradient, or pattern, typically
 * to paint the background before drawing anything else.
 */
export function drawCanvasBackground(
  ctx: CanvasRenderingContext2D,
  fillStyle: CanvasRenderingContext2D["fillStyle"],
) {
  const { width, height } = ctx.canvas;
  const previousTransform = ctx.getTransform();
  ctx.resetTransform();
  ctx.beginPath();
  ctx.fillStyle = fillStyle;
  ctx.fillRect(0, 0, width, height);
  ctx.setTransform(previousTransform);
}
