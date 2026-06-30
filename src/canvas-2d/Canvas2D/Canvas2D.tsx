import {
  ComponentPropsWithRef,
  Dispatch,
  SetStateAction,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { useMergedRef } from "../../hooks";
import { Camera2 } from "../Camera2";
import { defaultCanvasBackgroundColor } from "../style";
import {
  useCamera2DNavigation,
  omitCamera2DNavigationProps,
  Camera2DNavigationInputProps,
} from "../useCamera2DNavigation";

import styles from "./Canvas2D.module.css";

type NativeCanvasProps = ComponentPropsWithRef<"canvas">;

/**
 * A callback to draw onto the `Canvas2D`.
 *
 * It is called whenever the canvas needs to be redrawn (e.g., the camera or the
 * canvas size changed, or the callback's identity changed because the caller
 * re-rendered with new draw-dependent state). `Canvas2D` takes care of skipping
 * the call when there is no canvas, when its size is zero, or when no 2D context
 * is available, so implementations can assume `ctx` is valid. The canvas is
 * accessible as `ctx.canvas` if needed.
 */
export type Canvas2DDrawCallback = (
  ctx: CanvasRenderingContext2D,
  camera: Camera2,
) => void;

interface Canvas2DBaseProps extends NativeCanvasProps {
  camera: Camera2;

  /**
   * CSS color used to fill the canvas container. While resizing, the `<canvas>`
   * element lags its container by a frame or two (its size follows the camera,
   * which is only updated after a ResizeObserver callback), exposing a gap
   * between them. Painting the container with the canvas background color keeps
   * that overflow area matching the canvas instead of showing the parent's
   * background through it. Callers should set this to the same color they paint
   * in `onCanvasDraw`. Defaults to `defaultCanvasBackgroundColor`.
   */
  background?: string;

  onCanvasDraw?: Canvas2DDrawCallback;
}

/**
 * A <canvas> whose size is determined by the given `camera` but that does not
 * provide any navigation interaction.
 */
function Canvas2DBase({
  ref,
  className,
  camera,
  background = defaultCanvasBackgroundColor,
  onCanvasDraw,
  ...props
}: Canvas2DBaseProps) {
  const innerRef = useRef<HTMLCanvasElement>(null);
  const mergedRef = useMergedRef(innerRef, ref);

  // Redraw whenever the camera, the canvas size, or the draw callback change.
  useLayoutEffect(() => {
    const canvas = innerRef.current;
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    onCanvasDraw?.(ctx, camera);
  }, [camera, onCanvasDraw]);

  const className_ = className
    ? `${className} ${styles.Canvas}`
    : styles.Canvas;
  return (
    <div
      className={styles.CanvasContainer}
      style={background ? { background } : undefined}
    >
      <canvas
        ref={mergedRef}
        className={className_}
        style={{
          width: camera.canvasSize.x / window.devicePixelRatio,
          height: camera.canvasSize.y / window.devicePixelRatio,
        }}
        width={camera.canvasSize.x}
        height={camera.canvasSize.y}
        {...props}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}

// We assume that the navigation props are disjoint from the native canvas
// props, so that we can safely combine them in the props of this component.
type Canvas2DWithNavigationProps = Canvas2DBaseProps &
  Omit<Camera2DNavigationInputProps, "elementRef">;

/**
 * Calls `useCamera2DNavigation` and passes the resulting navigation props to
 * its render-prop `children`. Mounted by `Canvas2D` only when `setCamera` is
 * defined, so that the hook is never called when navigation is disabled.
 */
function Canvas2DWithNavigation({
  ref,
  camera,
  ...props
}: Canvas2DWithNavigationProps) {
  const innerRef = useRef<HTMLCanvasElement>(null);
  const mergedRef = useMergedRef(innerRef, ref);
  const navigationProps = useCamera2DNavigation({
    ...props,
    elementRef: innerRef,
    camera,
  });
  const baseProps = omitCamera2DNavigationProps(props);

  return (
    <Canvas2DBase
      ref={mergedRef}
      camera={camera}
      {...navigationProps}
      {...baseProps}
    />
  );
}

export interface Canvas2DProps extends Omit<
  Canvas2DWithNavigationProps,
  "camera" | "setCamera"
> {
  /**
   * The current camera (pan, rotate, zoom, and canvas size).
   *
   * `Canvas2D` supports both controlled and uncontrolled use of the camera:
   *
   * - If `camera` is provided, the camera is *controlled*: the caller owns
   *   (typically, as React state) and pass it down to `Canvas2D`. Typically,
   *   the caller would also provide `setCamera` to let the `Canvas2D` update
   *   the camera in response to navigation interaction.
   *
   * - If `camera` is omitted, the camera is *uncontrolled*: it is owned
   *   internally by `Canvas2D`, which is convenient for callers that don't need
   *   to observe it.
   */
  readonly camera?: Camera2;

  /**
   * The state setter for a controlled `camera`. The `Canvas2D` uses this to
   * apply pan / rotate / zoom.
   *
   * If `camera` is provided but `setCamera` is omitted, then the built-in
   * navigation is disabled.
   *
   * If `camera` is omitted, this prop is ignored.
   */
  readonly setCamera?: Dispatch<SetStateAction<Camera2>>;
}

/**
 * A `<canvas>` element with built-in 2D camera navigation (pan, rotate, zoom).
 *
 * The <canvas> width/height (that is, the number of pixels of the backing
 * store) is automatically set to match its parent's devicePixelContentBoxSize
 * via a ResizeObserver.
 *
 * The browser's context menu is prevented on right-click as it conflicts with
 * navigation interaction.
 *
 * Drawing is done by providing an `onCanvasDraw` callback, which is called with
 * a valid canvas, 2D context, and camera whenever a redraw is needed. The
 * underlying `<canvas>` element is also forwarded as a ref for callers that need
 * direct access. The camera can be used in either a controlled or uncontrolled
 * fashion via the `camera` / `setCamera` props.
 */
export function Canvas2D({
  camera: cameraProp,
  setCamera: setCameraProp,
  ...props
}: Canvas2DProps) {
  // Internal camera used if caller doesn't provide its own (uncontrolled mode)
  const [internalCamera, setInternalCamera] = useState<Camera2>(
    () => new Camera2(),
  );

  // Merged camera
  const camera = cameraProp ?? internalCamera;
  const setCamera = cameraProp ? setCameraProp : setInternalCamera;

  if (setCamera) {
    return (
      <Canvas2DWithNavigation
        camera={camera}
        setCamera={setCamera}
        {...props}
      />
    );
  } else {
    const baseProps = omitCamera2DNavigationProps(props);
    return <Canvas2DBase camera={camera} {...baseProps} />;
  }
}
