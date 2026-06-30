import { Vector2 } from "three";

import { Camera2 } from "./Camera2";

/**
 * Describes a pointer interaction on a 2D canvas driven by a `Camera2`.
 */
export interface Canvas2DPointerEvent {
  /**
   * The camera at the time of the interaction. During a drag, this is the
   * camera as it was when the drag started (the "camera on press"), so that
   * tool interactions are computed against a stable transform.
   */
  readonly camera: Camera2;

  /**
   * The pointer position in view coordinates (hardware pixels, relative to the
   * top-left corner of the canvas' content box).
   */
  readonly viewPosition: Vector2;

  /**
   * The pointer position in document (world) coordinates, obtained by
   * unprojecting `viewPosition` through `camera`.
   */
  readonly documentPosition: Vector2;

  /**
   * Whether the shift key was held during the interaction.
   */
  readonly shiftKey: boolean;
}
