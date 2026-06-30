import { Camera2 } from "./Camera2";

/**
 * Sets the canvas transform so that subsequent drawing is expressed in world
 * coordinates, mapping them to view (canvas pixel) coordinates according to
 * the given camera.
 *
 * The camera's view matrix is a 3x3 affine matrix (stored column-major in
 * `elements`), whose relevant components are passed to `ctx.setTransform()`.
 * After this call, drawing at a world-space position will appear at the
 * corresponding on-screen location for the camera's current pan, zoom, and
 * rotation.
 *
 * @param ctx - The 2D rendering context whose transform is set.
 * @param camera - The camera defining the world-to-view mapping.
 */
export function setCanvasTransform(
  ctx: CanvasRenderingContext2D,
  camera: Camera2,
) {
  const e = camera.viewMatrix().elements;
  ctx.setTransform(e[0], e[1], e[3], e[4], e[6], e[7]);
}
