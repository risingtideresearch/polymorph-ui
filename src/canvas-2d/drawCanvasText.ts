import { Vector2 } from "three";

import { Camera2 } from "./Camera2";
import { defaultCanvasBackgroundColor } from "./style";

import {
  defaultFontFamily,
  defaultScaledFontSize,
  defaultFontWeight,
} from "../utils";

export function drawCanvasCenteredText(
  ctx: CanvasRenderingContext2D,
  camera: Camera2,
  text: string,
  position: Vector2,
  fillStyle: string,
  font?: string,
  backgroundColor?: string,
) {
  const scale = 1 / camera.zoom;
  ctx.font =
    font ??
    `${defaultFontWeight} ${defaultScaledFontSize(scale)} ${defaultFontFamily}`;
  ctx.fillStyle = fillStyle;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = backgroundColor ?? defaultCanvasBackgroundColor;
  ctx.lineWidth = 3 * scale;

  ctx.save();
  ctx.translate(position.x, position.y);
  if (camera.yUp) {
    ctx.scale(1, -1);
  }
  ctx.strokeText(text, 0, 0);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}
