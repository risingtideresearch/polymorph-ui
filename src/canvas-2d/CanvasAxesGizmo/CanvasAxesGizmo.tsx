import { CSSProperties, useLayoutEffect, useRef } from "react";
import { Vector2 } from "three";
import { Camera2 } from "../Camera2";
import { Corner, defaultFontFamily, dpr } from "../../utils";
import styles from "./CanvasAxesGizmo.module.css";

/**
 * One labelled axis arrow of the axes gizmo.
 */
export interface CanvasAxisStyle {
  /** Short label drawn at the arrow's tip (e.g. `"X"`). */
  readonly label: string;
  /** Color of the arrow and its label. */
  readonly color: string;
}

/**
 * The two in-plane axes shown by the axes gizmo. Before any camera rotation,
 * `horizontal` points right and `vertical` points up.
 */
export interface CanvasAxesStyle {
  readonly horizontal: CanvasAxisStyle;
  readonly vertical: CanvasAxisStyle;
}

// Logical-pixel geometry of the axes gizmo.
const GIZMO_ARROW_LENGTH = 34; // shaft length from the origin to the arrow tip
const GIZMO_LABEL_GAP = 18; // extra reach past the tip for the axis label

/** How far the gizmo reaches from its origin along each in-plane axis. */
const GIZMO_REACH = GIZMO_ARROW_LENGTH + GIZMO_LABEL_GAP;

/**
 * Returns the logical-pixel size of an overlay canvas that can fully contain
 * the axes gizmo for any camera rotation, given the corner margins it is drawn
 * with. The two arrows are perpendicular and each reaches `GIZMO_REACH` from
 * the origin, so the gizmo's bounding box spans at most `GIZMO_REACH * sqrt(2)`
 * in each direction (when the arrows straddle the diagonal); a small pad
 * accounts for label glyphs extending past that.
 */
function getCanvasAxesGizmoSize(
  horizontalMargin: number,
  verticalMargin: number,
): { width: number; height: number } {
  const span = GIZMO_REACH * Math.SQRT2 + 10;
  return {
    width: Math.ceil(horizontalMargin + span),
    height: Math.ceil(verticalMargin + span),
  };
}

/**
 * Draws a labelled axes gizmo in the given `corner` (bottom-left by default) of
 * the canvas backing `ctx`, with arrows showing the positive direction of each
 * in-plane axis (accounting for any camera rotation).
 *
 * The gizmo is positioned relative to the dimensions of `ctx.canvas`, so it can
 * be drawn either directly onto a view canvas or onto a small dedicated overlay
 * canvas anchored to the frame (see `CanvasAxesGizmo`). Only the camera's rotation
 * is used; its pan and zoom do not affect the gizmo.
 *
 * `horizontalMargin` and `verticalMargin` are the insets (in logical pixels)
 * from the chosen corner's edges. They default to a small symmetric margin but
 * can be increased to keep the gizmo clear of other overlays, such as the
 * coordinate rulers.
 */
function drawCanvasAxesGizmo(
  ctx: CanvasRenderingContext2D,
  camera: Camera2,
  axes: CanvasAxesStyle,
  corner: Corner = "bottom-left",
  horizontalMargin = 22,
  verticalMargin = 22,
) {
  const d = dpr();
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const mx = horizontalMargin * d;
  const my = verticalMargin * d;
  const length = GIZMO_ARROW_LENGTH * d;

  // Screen-space directions of the in-plane axes (+horizontal to the right, +
  // vertical up, but rotated to match the camera).
  const m = camera.viewMatrix().elements;
  const hDir = new Vector2(m[0], m[1]);
  const vDir = new Vector2(m[3], m[4]);
  if (hDir.lengthSq() > 0) hDir.normalize();
  if (vDir.lengthSq() > 0) vDir.normalize();

  // Place the origin so the gizmo's full extent (both arrows and their labels)
  // sits in the requested corner, inset by `margin`. The arrows point along the
  // in-plane axes, so the extent relative to the origin depends on rotation.
  const reach = GIZMO_REACH * d;
  const ext = [
    new Vector2(0, 0),
    hDir.clone().multiplyScalar(reach),
    vDir.clone().multiplyScalar(reach),
  ];
  const minX = Math.min(...ext.map((p) => p.x));
  const maxX = Math.max(...ext.map((p) => p.x));
  const minY = Math.min(...ext.map((p) => p.y));
  const maxY = Math.max(...ext.map((p) => p.y));
  const isLeft = corner === "top-left" || corner === "bottom-left";
  const isTop = corner === "top-left" || corner === "top-right";
  const origin = new Vector2(
    isLeft ? mx - minX : w - mx - maxX,
    isTop ? my - minY : h - my - maxY,
  );

  ctx.resetTransform();
  ctx.font = `600 ${12 * d}px ${defaultFontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  drawArrow(
    ctx,
    origin,
    origin.clone().add(hDir.clone().multiplyScalar(length)),
    axes.horizontal.color,
    axes.horizontal.label,
    d,
  );
  drawArrow(
    ctx,
    origin,
    origin.clone().add(vDir.clone().multiplyScalar(length)),
    axes.vertical.color,
    axes.vertical.label,
    d,
  );

  // Origin dot.
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, 2 * d, 0, 2 * Math.PI);
  ctx.fillStyle = "#444";
  ctx.fill();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  from: Vector2,
  to: Vector2,
  color: string,
  label: string,
  d: number,
) {
  const dir = to.clone().sub(from);
  if (dir.lengthSq() === 0) {
    return;
  }
  dir.normalize();
  const normal = new Vector2(-dir.y, dir.x);
  const headLen = 7 * d;
  const headWidth = 4 * d;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8 * d;

  // Shaft.
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  // Head.
  const base = to.clone().sub(dir.clone().multiplyScalar(headLen));
  const left = base.clone().add(normal.clone().multiplyScalar(headWidth));
  const right = base.clone().sub(normal.clone().multiplyScalar(headWidth));
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(left.x, left.y);
  ctx.lineTo(right.x, right.y);
  ctx.closePath();
  ctx.fill();

  // Label, just beyond the head.
  const labelPos = to.clone().add(dir.clone().multiplyScalar(9 * d));
  ctx.fillText(label, labelPos.x, labelPos.y);
}

export interface CanvasAxesGizmoProps {
  /** The camera whose rotation orients the gizmo. */
  readonly camera: Camera2;

  /** The two in-plane axes to label (e.g. X and Y). */
  readonly axes: CanvasAxesStyle;

  /** Which corner of the parent the gizmo is anchored to. Defaults to bottom-left. */
  readonly corner?: Corner;

  /**
   * Insets (logical pixels) from the anchored corner's edges. Increase the
   * horizontal inset to keep the gizmo clear of other edge overlays, such as a
   * coordinate ruler. Both default to a small symmetric margin.
   */
  readonly horizontalMargin?: number;
  readonly verticalMargin?: number;
}

/**
 * The 2D axes gizmo, rendered into its own small canvas anchored (via CSS) to a
 * corner of its positioned parent.
 *
 * Keeping it out of the main view canvas means it doesn't jump around while the
 * parent is resized: a view canvas's backing store follows its camera and lags
 * the container by a frame or two during a resize, but this overlay is placed by
 * CSS and stays glued to the corner. Only the camera's rotation affects the
 * gizmo, so it redraws whenever the `camera` or `axes` change — pass a stable
 * (e.g. memoized) `axes` object to avoid redundant redraws.
 */
export function CanvasAxesGizmo({
  camera,
  axes,
  corner = "bottom-left",
  horizontalMargin = 22,
  verticalMargin = 22,
}: CanvasAxesGizmoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const d = window.devicePixelRatio;
  const { width, height } = getCanvasAxesGizmoSize(
    horizontalMargin,
    verticalMargin,
  );

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCanvasAxesGizmo(
      ctx,
      camera,
      axes,
      corner,
      horizontalMargin,
      verticalMargin,
    );
  }, [camera, axes, corner, horizontalMargin, verticalMargin]);

  const isLeft = corner === "top-left" || corner === "bottom-left";
  const isTop = corner === "top-left" || corner === "top-right";
  const style: CSSProperties = {
    width,
    height,
    top: isTop ? 0 : undefined,
    bottom: isTop ? undefined : 0,
    left: isLeft ? 0 : undefined,
    right: isLeft ? undefined : 0,
  };

  return (
    <canvas
      ref={canvasRef}
      className={styles.CanvasAxesGizmo}
      style={style}
      width={width * d}
      height={height * d}
    />
  );
}
