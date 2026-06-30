import {
  useCallback,
  RefObject,
  useRef,
  PointerEvent as ReactPointerEvent,
} from "react";

import { usePointerEventsContext } from "../contexts/PointerEventsContext";

/**
 * Input callbacks for the usePointerEvents() hook.
 */
export interface PointerEventsInputProps<DragData> {
  /**
   * A ref to the HTML element onto which click or drag actions are defined
   */
  elementRef: RefObject<HTMLElement | null>;

  /**
   * Whether the default "pointerdown", "pointermove", and "pointerup" of the
   * targetted element should be prevented. The default is `false`.
   */
  preventDefault?: boolean;

  /**
   * This function is called whenever the pointer enters the HTML element
   * without an ongoing drag action.
   *
   * This function intentionally does not accept a pointer event, as we
   * consider it bad practice and bug-prone to specify an enter behavior that
   * depends on the pointer position, and that would do something different
   * than the hover behavior.
   *
   * If you need to define pointer enter behavior that depends on the pointer
   * event, implement `onHover` instead, which is also automatically called
   * when the pointer enters the HTML element.
   */
  onEnter?: () => void;

  /**
   * This function is called whenever the pointer leaves the HTML element
   * without an ongoing drag action.
   *
   * This function intentionally does not accept a pointer event, as we
   * consider it bad practice to specify leave behavior that depends on the
   * pointer position.
   */
  onLeave?: () => void;

  /**
   * This function is called whenever the pointer enters the HTML element or
   * moves over it, with no ongoing drag or click action.
   *
   * This is the recommended function to use whenever you'd be tempted to use
   * a native pointermove event. Unlike pointermove, this function is also
   * fired when the pointer doesn't move, but still changes from being
   * outside the element to being inside the element, for example after
   * switching windows with Alt-Tab.
   */
  onHover?: (event: PointerEvent) => void;

  /**
   * This function should return whether there is a drag action possible for the
   * given pointerdown `event`. Returning `false` or `undefined` means no drag
   * action is possible. Returning `true` or some other arbitrary data means a
   * drag action is possible.
   *
   * If a drag action is possible and not disambiguated into a click action,
   * then one call to `onDragStart`, one or more calls to `onDragMove`, and one
   * call to `onDragEnd` will follow up, and they will be passed as parameter
   * the drag data returned during the `hasDrag`call.
   *
   * If you want to support both dragging (e.g., with the left button), and
   * opening the native browser context menu with a right click, then it is
   * important that your implementation of this function returns `false` or
   * `undefined` when `event.button` is 2 (right button). Otherwise, the system
   * assumes that dragging with the right button is possible, and automatically
   * prevents the opening of the context menu in order to make the drag
   * possible.
   *
   * Note that due to browser limitations, it is not possible to support both
   * dragging with the right button and opening the context menu with the right
   * button. Indeed, in order to disambiguate between the click and the drag, we
   * would have to suppress the context menu on pointerdown, and if we
   * disambiguate it to a click on pointerup, we would have to open the context
   * menu at that moment. Unfortunately, there is no programmatic API to open
   * the context menu, so we cannot do this.
   */
  hasDrag?: (event: PointerEvent) => DragData | undefined;

  /**
   * This function is called when the drag action is initiated (which may not
   * happen immediately upon pointerdown, due to disambiguation between click
   * and drag). However, the given `event` is always that of the initial
   * pointerdown.
   */
  onDragStart?: (event: PointerEvent, data: DragData) => void;

  /**
   * This function is called at each pointermove `event` during a drag action.
   */
  onDragMove?: (event: PointerEvent, data: DragData) => void;

  /**
   * This function is called at the given pointerup `event` at the end of a drag action.
   */
  onDragEnd?: (event: PointerEvent, data: DragData) => void;

  /**
   * This function is called at the given `event` if no drag action was
   * possible, or if it was disambiguated into a click action due to the
   * pointer moving less than a threshold between the down and up events.
   */
  onClick?: (event: PointerEvent) => void;
}

/**
 * Output callbacks of the usePointerEvents() hook, to be passed to the HTML
 * component on which the drag or click actions are defined.
 */
export interface PointerEventsOutputProps {
  onPointerEnter: (event: ReactPointerEvent) => void;
  onPointerLeave: (event: ReactPointerEvent) => void;
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
}

/**
 * This hook provides a uniform, safer, and sometimes easier way to handle
 * pointer events, especially when dragging is involved:
 *
 * - It automatically disambiguates between click and drag events.
 *
 * - During a drag event, it prevents concurrent hover/click/drag events.
 *
 * - It "captures the pointer" on drag start, allowing to continue the drag
 *   action outside the bound of the HTML element on which the drag was
 *   initiated.
 *
 * - It allows you to use a PointerEvent as argument to your onClick callback.
 *   Indeed, in React (as of React 19), the onClick event handler expects a
 *   React.MouseEvent<T>, despite modern Javascript providing a PointerEvent
 *   instead.
 *
 * Example usage:
 *
 * ```
 * interface DragData {
 *   x: number,
 *   y: number,
 * }
 *
 * function MyComponent() {
 *    const ref = useRef<HTMLDivElement>(null);
 *
 *    const onHover = useCallback((event: IPointerEvent) => {
 *      console.log(`hover at (${event.clientX}, ${event.clientY})`);
 *    }, []);
 *
 *    const hasDrag = useCallback((event: IPointerEvent): DragData | undefined => {
 *      return { x: event.clientX, y: event.clientY };
 *      // => can also return false or undefined if you wish not to
 *      //    have any drag action at that position
 *    }, []);
 *
 *    const onDragStart = useCallback((event: IPointerEvent, data: DragData) => {
 *      console.log(`drag start at (${data.x}, ${data.y})`);
 *    }, []);
 *
 *    const onDragMove = useCallback((event: IPointerEvent, data: DragData) => {
 *      console.log(`drag move by (${data.x - event.clientX}, ${data.y - event.clientY})`);
 *    }, []);
 *
 *    const onDragEnd = useCallback((event: IPointerEvent, data: DragData) => {
 *      console.log(`drag end at (${event.clientX}, ${event.clientY})`);
 *    }, []);
 *
 *    const onClick = useCallback((event: IPointerEvent) => {
 *      console.log(`click at (${event.clientX}, ${event.clientY})`);
 *    }, []);
 *
 *    const pointerEvents = usePointerEvents({
 *      onHover: onHover,
 *      onDragStart: onDragStart,
 *      onDragMove: onDragMove,
 *      onDragEnd: onDragEnd,
 *      onClick: onClick,
 *    });
 *
 *    return <div ref={ref} {...pointerEvents} />;
 * }
 */
export function usePointerEvents<DragData>({
  preventDefault,
  onEnter,
  onLeave,
  onHover,
  hasDrag,
  onDragStart,
  onDragMove,
  onDragEnd,
  onClick,
}: PointerEventsInputProps<DragData>): PointerEventsOutputProps {
  const context = usePointerEventsContext();
  const dragData = useRef<DragData | undefined>(undefined);

  const preventDefault_ = preventDefault ?? false;

  const onPointerEnter = useCallback(
    (event: ReactPointerEvent) => {
      onEnter?.();
      onHover?.(event.nativeEvent);
    },
    [onEnter, onHover],
  );

  const onPointerLeave = useCallback(() => {
    onLeave?.();
  }, [onLeave]);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent) => {
      if (context.isClickOrDragging) {
        // Already handled by the ClickOrDragContext
        return;
      }
      onHover?.(event.nativeEvent);
    },
    [onHover, context],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      // Ignore event if already handled by another mechanism, e.g.,
      // react-resizable-panels resizing
      if (event.defaultPrevented) {
        return;
      }

      // Ignore other buttons during click or drag
      if (
        context.isClickOrDragging &&
        context.clickOrDragButton !== event.button
      ) {
        return;
      }

      if (preventDefault_) {
        event.preventDefault();
      }

      const nativeEvent = event.nativeEvent;
      if (onClick) {
        context.registerClickCandidate(nativeEvent, {
          priority: 0,
          onClick: (event: PointerEvent) => {
            onClick?.(event);
          },
        });
      }
      if (hasDrag) {
        const dragData_ = hasDrag(nativeEvent);
        dragData.current = dragData_;
        if (dragData_) {
          context.registerDragCandidate(nativeEvent, {
            priority: 0,
            onDragStart: (event: PointerEvent) => {
              onDragStart?.(event, dragData_);
            },
            onDragMove: (event: PointerEvent) => {
              onDragMove?.(event, dragData_);
            },
            onDragEnd: (event: PointerEvent) => {
              onDragEnd?.(event, dragData_);
              dragData.current = undefined;
            },
          });
        }
      }
    },
    [
      context,
      preventDefault_,
      onClick,
      hasDrag,
      onDragStart,
      onDragMove,
      onDragEnd,
    ],
  );

  return { onPointerEnter, onPointerLeave, onPointerDown, onPointerMove };
}
