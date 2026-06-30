import {
  Dispatch,
  RefObject,
  SetStateAction,
  useCallback,
  WheelEvent as ReactWheelEvent,
  useEffect,
} from "react";

import { Vector2 } from "three";

import { usePointerEvents, PointerEventsOutputProps } from "../hooks";
import { getPointerViewPosition, PointerShortcut } from "../utils";

import { Camera2 } from "./Camera2";
import { Canvas2DPointerEvent } from "./Canvas2DPointerEvent";
import { getPointerDocumentPosition } from "./getPointerDocumentPosition";

/**
 * Built-in click actions on a 2D canvas (navigation only).
 */
type Canvas2DClickAction = "resetRotation";

/**
 * Built-in drag actions on a 2D canvas. "tool" is delegated to the application
 * via the `onTool*` callbacks; "pan" and "rotate" are handled internally.
 */
type Canvas2DDragAction = "tool" | "pan" | "rotate";

type Canvas2DClickShortcut = readonly [Canvas2DClickAction, PointerShortcut];
type Canvas2DDragShortcut = readonly [Canvas2DDragAction, PointerShortcut];

// For now, we allow both Blender-style and Rhino-style navigation.
// In the future, the default might be to only have one of them and let the user choose.
//
// TODO: implement scrubby zoom via Ctrl + MiddleButton (or RightButton)
//
const DEFAULT_CLICK_SHORTCUTS: Canvas2DClickShortcut[] = [
  ["resetRotation", new PointerShortcut("Alt+Shift+MiddleButton")],
  ["resetRotation", new PointerShortcut("Alt+Shift+RightButton")],
];
const DEFAULT_DRAG_SHORTCUTS: Canvas2DDragShortcut[] = [
  ["pan", new PointerShortcut("MiddleButton")],
  ["pan", new PointerShortcut("RightButton")],
  ["rotate", new PointerShortcut("Alt+Shift+MiddleButton")],
  ["rotate", new PointerShortcut("Alt+Shift+RightButton")],
];

/**
 * Internal drag state shared between drag start/move/end.
 */
interface Canvas2DCameraDragData {
  readonly action: Canvas2DDragAction;
  readonly viewPosOnPress: Vector2;
  readonly cameraOnPress: Camera2;
}

export interface Camera2DNavigationInputProps {
  /**
   * A ref to the HTML element (e.g., <canvas> or <svg>) on which pointer
   * interactions are bound.
   */
  readonly elementRef: RefObject<HTMLElement | null>;

  /**
   * The current camera, owned by the caller as React state.
   */
  readonly camera: Camera2;

  /**
   * The state setter for the camera. The hook uses the updater form to apply
   * pan / rotate / zoom.
   */
  readonly setCamera: Dispatch<SetStateAction<Camera2>>;

  /**
   * Number of zoom steps per 120 units of wheel delta. Defaults to 1.
   */
  readonly zoomSpeed?: number;

  /**
   * Overrides the built-in navigation drag bindings (pan / rotate).
   */
  readonly dragShortcuts?: readonly Canvas2DDragShortcut[];

  /**
   * Overrides the built-in navigation click bindings (resetRotation).
   */
  readonly clickShortcuts?: readonly Canvas2DClickShortcut[];

  // ---- Application interaction callbacks ----
  //
  // These receive a generic Canvas2DPointerEvent. The application is expected
  // to augment it with its own context (document, view, etc.) before
  // dispatching to its tools.

  readonly onHover?: (event: Canvas2DPointerEvent) => void;
  readonly onEnter?: () => void;
  readonly onLeave?: () => void;

  /**
   * Returns whether a left-button press should begin a tool drag. If it
   * returns `false`, the press is ignored (no built-in drag is started for the
   * left button).
   */
  readonly hasToolDrag?: (event: Canvas2DPointerEvent) => boolean;
  readonly onToolDragStart?: (event: Canvas2DPointerEvent) => void;
  readonly onToolDragMove?: (event: Canvas2DPointerEvent) => void;
  readonly onToolDragEnd?: (event: Canvas2DPointerEvent) => void;

  /**
   * Called on a left-button click that did not match any navigation click
   * binding.
   */
  readonly onToolClick?: (event: Canvas2DPointerEvent) => void;
}

/**
 * Strips all navigation-only props from a combined props object, returning the
 * remainder. Use this at the boundary between a navigation-aware component and
 * an underlying element to prevent navigation props from leaking onto the DOM.
 */
export function omitCamera2DNavigationProps<
  T extends Partial<Camera2DNavigationInputProps>,
>(props: T): Omit<T, keyof Camera2DNavigationInputProps> {
  const {
    elementRef: _elementRef,
    camera: _camera,
    setCamera: _setCamera,
    zoomSpeed: _zoomSpeed,
    dragShortcuts: _dragShortcuts,
    clickShortcuts: _clickShortcuts,
    onHover: _onHover,
    onEnter: _onEnter,
    onLeave: _onLeave,
    hasToolDrag: _hasToolDrag,
    onToolDragStart: _onToolDragStart,
    onToolDragMove: _onToolDragMove,
    onToolDragEnd: _onToolDragEnd,
    onToolClick: _onToolClick,
    ...rest
  } = props;
  return rest as Omit<T, keyof Camera2DNavigationInputProps>;
}

/**
 * Props to spread onto the navigated element: onPointerEnter/Leave,
 * onPointerDown/Move/Up, onWheel, etc.
 */
export interface Camera2DNavigationOutputProps extends PointerEventsOutputProps {
  readonly onWheel: (event: ReactWheelEvent) => void;
}

/**
 * Provides 2D camera navigation (pan, rotate, zoom) for a given element,
 * typically a <canvas> or <svg> element.
 *
 * Example:
 *
 * ```
 * function MyCanvas() {
 *   const ref = useRef<HTMLCanvasElement | null>(null);
 *   const [camera, setCamera] = useState(new Camera2());
 *   const { navigationProps } = useCamera2DNavigation({ elementRef: ref, camera, setCamera });
 *   return <canvas ref={ref} {...navigationProps} />;
 * }
 * ```
 *
 *  The caller owns the `Camera2` as React state and is responsible for drawing
 * or updating its content whenever the camera changes. Note that the camera's
 * `canvasSize` is automatically kept in sync with the size of the element's
 * parent, so the caller can use it to properly handle resizing.
 *
 * Application-specific interactions (hovering, dragging, and clicking with a
 * tool) are delegated to the `onTool*` / `onHover` / `onEnter` / `onLeave`
 * callbacks, which receive a `Canvas2DPointerEvent`. The application typically
 * spreads this event and attaches its own context before dispatching to its
 * tools.
 *
 */
export function useCamera2DNavigation(
  options: Camera2DNavigationInputProps,
): Camera2DNavigationOutputProps {
  const {
    elementRef,
    camera,
    setCamera,
    zoomSpeed = 1,
    dragShortcuts = DEFAULT_DRAG_SHORTCUTS,
    clickShortcuts = DEFAULT_CLICK_SHORTCUTS,
    onHover,
    onEnter,
    onLeave,
    hasToolDrag,
    onToolDragStart,
    onToolDragMove,
    onToolDragEnd,
    onToolClick,
  } = options;

  const makeEvent = useCallback(
    (
      event: PointerEvent,
      camera: Camera2,
      element: HTMLElement,
    ): Canvas2DPointerEvent => ({
      camera: camera,
      viewPosition: getPointerViewPosition(event, element),
      documentPosition: getPointerDocumentPosition(event, element, camera),
      shiftKey: event.shiftKey,
    }),
    [],
  );

  const handleHover = useCallback(
    (event: PointerEvent) => {
      const element = elementRef.current;
      if (!element) {
        return;
      }
      onHover?.(makeEvent(event, camera, element));
    },
    [elementRef, camera, onHover, makeEvent],
  );

  const hasDrag = useCallback(
    (event: PointerEvent): Canvas2DCameraDragData | undefined => {
      const element = elementRef.current;
      if (!element) {
        return;
      }

      function data(action: Canvas2DDragAction): Canvas2DCameraDragData {
        return {
          action: action,
          viewPosOnPress: getPointerViewPosition(event, element!),
          cameraOnPress: camera.clone(),
        };
      }

      if (event.button === 0) {
        if (hasToolDrag?.(makeEvent(event, camera, element))) {
          return data("tool");
        }
      } else {
        for (const [action, shortcut] of dragShortcuts) {
          if (shortcut.matches(event)) {
            return data(action);
          }
        }
      }
    },
    [elementRef, camera, hasToolDrag, dragShortcuts, makeEvent],
  );

  const onDragStart = useCallback(
    (event: PointerEvent, data: Canvas2DCameraDragData) => {
      const element = elementRef.current;
      if (!element) {
        return;
      }
      if (data.action === "tool") {
        onToolDragStart?.(makeEvent(event, data.cameraOnPress, element));
      }
    },
    [elementRef, onToolDragStart, makeEvent],
  );

  const onDragMove = useCallback(
    (event: PointerEvent, data: Canvas2DCameraDragData) => {
      const element = elementRef.current;
      if (!element) {
        return;
      }
      const viewPos = getPointerViewPosition(event, element);
      switch (data.action) {
        case "tool": {
          onToolDragMove?.(makeEvent(event, data.cameraOnPress, element));
          break;
        }
        case "pan": {
          const viewDelta = viewPos.clone().sub(data.viewPosOnPress);
          const nextCenter = data.cameraOnPress.center.clone().sub(viewDelta);
          const nextCamera = data.cameraOnPress.clone();
          nextCamera.center = nextCenter;
          setCamera(nextCamera);
          break;
        }
        case "rotate": {
          const viewDelta = viewPos.clone().sub(data.viewPosOnPress);
          const rotateSensitivity = 0.01; // 100px -> 1rad
          const anchor = data.viewPosOnPress;
          const angle = rotateSensitivity * (viewDelta.x - viewDelta.y);
          const nextCamera = data.cameraOnPress.clone();
          nextCamera.rotateAround(anchor, angle);
          setCamera(nextCamera);
          break;
        }
      }
    },
    [elementRef, setCamera, onToolDragMove, makeEvent],
  );

  const onDragEnd = useCallback(
    (event: PointerEvent, data: Canvas2DCameraDragData) => {
      const element = elementRef.current;
      if (!element) {
        return;
      }
      if (data.action === "tool") {
        onToolDragEnd?.(makeEvent(event, data.cameraOnPress, element));
      }
    },
    [elementRef, onToolDragEnd, makeEvent],
  );

  const onClick = useCallback(
    (event: PointerEvent) => {
      const element = elementRef.current;
      if (!element) {
        return;
      }
      for (const [action, shortcut] of clickShortcuts) {
        if (shortcut.matches(event)) {
          switch (action) {
            case "resetRotation": {
              const anchor = getPointerViewPosition(event, element);
              const nextCamera = camera.clone();
              nextCamera.setRotationAround(anchor, 0);
              setCamera(nextCamera);
            }
          }
          return;
        }
      }
      if (event.button === 0) {
        onToolClick?.(makeEvent(event, camera, element));
      }
    },
    [elementRef, camera, setCamera, clickShortcuts, onToolClick, makeEvent],
  );

  const pointerProps = usePointerEvents<Canvas2DCameraDragData>({
    elementRef,
    onHover: handleHover,
    onEnter,
    onLeave,
    hasDrag,
    onDragStart,
    onDragMove,
    onDragEnd,
    onClick,
  });

  const onWheel = useCallback(
    (event: ReactWheelEvent) => {
      const canvas = elementRef.current;
      if (!canvas) {
        return;
      }
      // TODO: support all delta modes
      // 0 = pixels (120px for one scroll step)
      // 1 = lines
      // 2 = pages
      if (event.deltaMode != 0) {
        return;
      }
      const anchor = getPointerViewPosition(event, canvas);
      const steps = (-event.deltaY / 120) * zoomSpeed * window.devicePixelRatio;
      setCamera((prev) => prev.clone().zoomAt(anchor, steps));
    },
    [elementRef, setCamera, zoomSpeed],
  );

  // Keep `camera.canvasSize` in sync with the device-pixel size of the
  // element's parent.
  //
  // The `camera.canvasSize` can in turn be used to properly handle resizing of
  // the element, e.g., setting the <canvas> width/height attributes or the
  // viewBox of an <svg>.
  //
  useEffect(() => {
    const div = elementRef.current?.parentNode as HTMLElement | null;
    if (!div) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries.find((entry) => entry.target === div);
      if (entry) {
        let w = 0;
        let h = 0;
        if (entry.devicePixelContentBoxSize) {
          const contentBox = entry.devicePixelContentBoxSize[0];
          w = contentBox.inlineSize;
          h = contentBox.blockSize;
        } else {
          const dpr = window.devicePixelRatio || 1;
          w = Math.round(entry.contentRect.width * dpr);
          h = Math.round(entry.contentRect.height * dpr);
        }
        setCamera((prev) => {
          if (prev.canvasSize.x != w || prev.canvasSize.y != h) {
            const nextCamera = prev.clone();
            nextCamera.canvasSize = new Vector2(w, h);
            return nextCamera;
          }
          return prev;
        });
      }
    });
    try {
      observer.observe(div, { box: "device-pixel-content-box" });
    } catch (error) {
      console.log("device pixel not supported, using content box", error);
      observer.observe(div, { box: "content-box" });
    }
    return () => {
      observer.disconnect();
    };
  }, [elementRef, setCamera]);

  return { ...pointerProps, onWheel };
}
