import { type ComponentProps, PropsWithChildren, Suspense } from "react";
import { Canvas, events as defaultEvents } from "@react-three/fiber";
import { Object3D } from "three";

import { filterByPointerEventPriority } from "./pointerEventPriority";
import { defaultCanvasBackgroundColor } from "../canvas-2d";
import {
  Canvas3DCameraOptions,
  defaultCanvas3DCameraOptions,
} from "./Canvas3DCamera";
import { Canvas3DCameras } from "./Canvas3DCameras";

Object3D.DEFAULT_UP.set(0, 0, 1); // Set the up direction to Z-axis

const canvasEvents: NonNullable<ComponentProps<typeof Canvas>["events"]> = (
  state,
) => ({
  ...defaultEvents(state),
  filter: filterByPointerEventPriority,
});

export interface Canvas3DProps extends PropsWithChildren {
  /**
   * If set, fills the canvas background with this CSS color. Otherwise
   * uses the `defaultCanvasBackgroundColor`.
   */
  background?: string;

  /**
   * Whether to use a perspective camera (the default) or an orthographic one.
   * Orthographic callers will typically also pass a matching `camera`.
   */
  orthographic?: boolean;

  /**
   * Camera configuration forwarded to the underlying `@react-three/fiber`
   * canvas. Defaults to `defaultCanvas3DCamera`.
   */
  camera?: Canvas3DCameraOptions;

  /**
   * Called when a pointer event does not hit any 3D object, for example to
   * clear the selection on a background click. As with the underlying
   * `@react-three/fiber` `onPointerMissed`, this fires for both background
   * pointer-downs and clicks, so callers that only care about clicks should
   * check `event.type === "click"`.
   */
  onPointerMissed?: (event: MouseEvent) => void;
}

/**
 * A `@react-three/fiber` canvas preconfigured for a Z-up CAD viewport, with
 * on-demand rendering and an events filter that honors `pointerEventPriority`.
 *
 * It always holds both a perspective and an orthographic camera (see
 * `Canvas3DCameras`) and makes one of them the default per the `orthographic`
 * prop. Toggling `orthographic` therefore switches projection in place—the live
 * view is carried across—without remounting the canvas. The `camera` prop seeds
 * both cameras' initial pose.
 *
 * The canvas itself is intentionally minimal: navigation and the orientation
 * gizmo are not included, so each app can opt into them. Add
 * `Canvas3DOrbitControls` (optionally with a `target`) and/or
 * `Canvas3DAxesGizmo` as children, alongside the scene contents and any lights.
 *
 * Children are rendered inside a `Suspense` boundary. Pointer interactions on
 * the scene are best defined with `use3DPointerEvents`, which—together with
 * `Canvas3DOrbitControls`—shares the app-wide `PointerEventsContext` so that
 * hovering or selecting cannot happen at the same time as orbiting.
 */
export function Canvas3D({
  children,
  background = defaultCanvasBackgroundColor,
  orthographic = true,
  camera = defaultCanvas3DCameraOptions,
  onPointerMissed,
}: Canvas3DProps) {
  const dpr = Math.min(
    typeof window !== "undefined" ? window.devicePixelRatio : 1,
    2,
  );

  return (
    <Canvas
      events={canvasEvents}
      dpr={dpr}
      // While resizing, the WebGL `<canvas>` element lags its container by a
      // frame or two, exposing a gap between them. The container is transparent
      // by default, so the parent's background shows through that gap. Painting
      // the container with the same color keeps the overflow area matching the
      // canvas background instead.
      style={background ? { background } : undefined}
      frameloop="demand"
      // r3f measures the canvas with `react-use-measure`, whose ResizeObserver
      // callback is (counter-intuitively) debounced by the *scroll* debounce,
      // which r3f defaults to 50ms. Dragging an Area's edge only triggers that
      // ResizeObserver (not a window resize), so with `frameloop="demand"` the
      // viewport only catches up ~50ms after you stop dragging. We disable the
      // debounce so it tracks the container in real time.
      resize={{ debounce: { scroll: 0, resize: 0 } }}
      onPointerMissed={onPointerMissed}
      onPointerDownCapture={(e) => {
        if (e.defaultPrevented) {
          e.stopPropagation();
        }
      }}
    >
      {background && <color attach="background" args={[background]} />}
      <Canvas3DCameras orthographic={orthographic} camera={camera} />
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
