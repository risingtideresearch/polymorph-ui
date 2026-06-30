import { Vector2 } from "three";

import { Camera2 } from "./Camera2";
import { defaultGridColors, minorGridCellSize } from "./drawCanvasGrid";
import { defaultCanvasBackgroundColor } from "./style";

import { defaultFontFamily } from "../utils";

/**
 * Options for drawing ruler labels with `drawCanvasGridRuler`.
 */
export interface GridRulerOptions {
  /**
   * A unit abbreviation appended to each label (e.g. `"in"`, `"mm"`). If
   * omitted, labels show the bare numeric value.
   */
  readonly unit?: string;

  /** Text color. Defaults to the grid's axes color. */
  readonly color?: string;

  /**
   * Color of the halo drawn behind the text for legibility over the grid and
   * other content. Defaults to the canvas background color.
   */
  readonly background?: string;

  /** Font family used for the labels. Defaults to the UI default. */
  readonly fontFamily?: string;

  /**
   * If `true`, the left (vertical-axis) ruler labels are drawn rotated 90°
   * (reading bottom-to-top) instead of horizontally. This makes the ruler take
   * a constant amount of horizontal space regardless of the label values.
   */
  readonly rotateVerticalLabels?: boolean;
}

/**
 * Returns a "nice" ruler step (in document coordinates) that is a multiple of
 * the minor grid cell size — so that labels always land on grid lines — while
 * being at least `targetGapPx` pixels apart on screen to avoid overlap.
 *
 * The multiplier follows the usual 1, 2, 5, 10, 20, 50, ... progression.
 */
function niceRulerStep(
  minorSize: number,
  zoom: number,
  targetGapPx: number,
): number {
  const mults = [1, 2, 5];
  let decade = 1;
  for (let i = 0; i < 100; i++) {
    const k = mults[i % 3] * decade;
    if (k * minorSize * zoom >= targetGapPx) {
      return k * minorSize;
    }
    if (i % 3 === 2) {
      decade *= 10;
    }
  }
  return minorSize * decade;
}

/**
 * Draws grid coordinate labels ("rulers") along the top and left edges of the
 * canvas: the top ruler labels the vertical grid lines (X coordinates) and the
 * left ruler labels the horizontal grid lines (Y coordinates).
 *
 * The labels are drawn directly onto the canvas in screen space (with a halo
 * for legibility) rather than in a separate fixed-size gutter, so they do not
 * take away any drawing space. Their values and positions match the grid drawn
 * by `drawCanvasGrid` for the same camera, expressed in document coordinates.
 *
 * Because the labels are pinned to the edges, call this *after* drawing the
 * scene content so they stay visible on top of it.
 *
 * Each label is positioned where its grid line crosses the ruler's edge, so the
 * labels stay aligned with the grid even when the camera is rotated. (Near a
 * quarter-turn the X grid lines become horizontal on screen — and the Y lines
 * vertical — so the matching ruler has nothing to label and stays empty.)
 */
export function drawCanvasGridRuler(
  ctx: CanvasRenderingContext2D,
  camera: Camera2,
  options: GridRulerOptions = {},
) {
  const {
    unit = "",
    color = defaultGridColors.axes,
    background = defaultCanvasBackgroundColor,
    fontFamily = defaultFontFamily,
    rotateVerticalLabels = false,
  } = options;

  const w = camera.canvasSize.x;
  const h = camera.canvasSize.y;
  if (w <= 0 || h <= 0 || camera.zoom <= 0) {
    return;
  }

  const documentToView = camera.viewMatrix();
  const viewToDocument = documentToView.clone().invert();

  // Express the visible view rectangle in document coordinates.
  const corners = [
    new Vector2(0, 0),
    new Vector2(w, 0),
    new Vector2(w, h),
    new Vector2(0, h),
  ].map((p) => p.applyMatrix3(viewToDocument));
  const xMin = Math.min(...corners.map((p) => p.x));
  const xMax = Math.max(...corners.map((p) => p.x));
  const yMin = Math.min(...corners.map((p) => p.y));
  const yMax = Math.max(...corners.map((p) => p.y));

  // Screen-space images of the document axes (the columns of the view matrix's
  // linear part): increasing the document X coordinate by one unit moves a point
  // `xAxisDir` pixels on screen, and increasing Y moves it `yAxisDir`. Under
  // camera rotation these are not axis-aligned, so a vertical grid line (constant
  // X) is generally slanted on screen; we follow these directions to find where
  // each grid line crosses the ruler's edge.
  const m = documentToView.elements;
  const xAxisDir = new Vector2(m[0], m[1]);
  const yAxisDir = new Vector2(m[3], m[4]);

  // Device-pixel layout (the grid is drawn in the canvas' backing store, whose
  // coordinates are device pixels).
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const fontPx = 11 * dpr;
  const pad = 4 * dpr;
  // The top ruler occupies this band; the left ruler starts below it so the two
  // do not collide in the top-left corner.
  const topBand = fontPx + 2 * pad;

  // Choose a label step aligned to the grid and spaced enough to avoid overlap.
  const minorSize = minorGridCellSize(camera.zoom);
  const step = niceRulerStep(minorSize, camera.zoom, 56 * dpr);
  const decimals = Math.max(0, -Math.round(Math.log10(minorSize)));
  const format = (value: number) => value.toFixed(decimals) + unit;

  ctx.save();
  ctx.resetTransform();
  ctx.font = `500 ${fontPx}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.strokeStyle = background;
  ctx.lineWidth = 3 * dpr;
  ctx.lineJoin = "round";

  // Top ruler: one label per visible vertical grid line, drawn where that line
  // crosses the band so it stays aligned with the grid even under rotation. The
  // vertical grid line at document X = value runs along `yAxisDir` on screen; we
  // follow it from a known point to the band's horizontal center line. (If
  // `yAxisDir` is horizontal — camera rotated ~90° — the line never reaches the
  // band, so the ruler is empty.)
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const topLineY = pad + fontPx / 2;
  if (Math.abs(yAxisDir.y) > 1e-6) {
    for (let i = Math.ceil(xMin / step); i <= Math.floor(xMax / step); i++) {
      const value = i * step;
      const base = new Vector2(value, 0).applyMatrix3(documentToView);
      const screenX = base.x + ((topLineY - base.y) / yAxisDir.y) * yAxisDir.x;
      if (screenX < pad || screenX > w - pad) {
        continue;
      }
      const text = format(value);
      ctx.strokeText(text, screenX, pad);
      ctx.fillText(text, screenX, pad);
    }
  }

  // Left ruler: one label per visible horizontal grid line, drawn where that
  // line crosses the label column so it stays aligned with the grid even under
  // rotation. When rotated, the text reads bottom-to-top and is centered on its
  // grid line; otherwise it is left-aligned along the edge. The horizontal grid
  // line at document Y = value runs along `xAxisDir` on screen; we follow it to
  // the column's center. (If `xAxisDir` is vertical — camera rotated ~90° — the
  // line never reaches the column, so the ruler is empty.)
  ctx.textAlign = rotateVerticalLabels ? "center" : "left";
  ctx.textBaseline = "middle";
  const leftLineX = rotateVerticalLabels ? pad + fontPx / 2 : pad;
  if (Math.abs(xAxisDir.x) > 1e-6) {
    for (let i = Math.ceil(yMin / step); i <= Math.floor(yMax / step); i++) {
      const value = i * step;
      const base = new Vector2(0, value).applyMatrix3(documentToView);
      const screenY = base.y + ((leftLineX - base.x) / xAxisDir.x) * xAxisDir.y;
      if (screenY < topBand || screenY > h - pad) {
        continue;
      }
      const text = format(value);
      if (rotateVerticalLabels) {
        ctx.save();
        ctx.translate(leftLineX, screenY);
        ctx.rotate(-Math.PI / 2);
        ctx.strokeText(text, 0, 0);
        ctx.fillText(text, 0, 0);
        ctx.restore();
      } else {
        ctx.strokeText(text, leftLineX, screenY);
        ctx.fillText(text, leftLineX, screenY);
      }
    }
  }

  ctx.restore();
}
