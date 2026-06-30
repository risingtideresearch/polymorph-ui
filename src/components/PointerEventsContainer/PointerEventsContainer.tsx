import { useSyncExternalStore } from "react";
import {
  PointerEventsContext,
  useNewPointerEventsContext,
} from "../../contexts/PointerEventsContext";

/**
 * A <div> container that enhances pointer events handling for its children.
 *
 * This component provides a shared context for pointer events, preventing
 * simultaneous dragging interactions across multiple components. It ensures
 * that when one component is being dragged, other components do not respond to
 * pointer events until the drag operation is completed.
 *
 * This component is meant to be used in combination with the `usePointerEvents`
 * hook.
 */
export function PointerEventsContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create context.
  //
  const context = useNewPointerEventsContext();

  // Rerender this PointerEventsContainer whenever the context changes, in order
  // to update the `pointer-events` CSS property accordingly.
  //
  // Note that this does not cause its children to rerender.
  //
  // Also note that `use[New]PointerEventsContext` by itself does not cause a
  // rerender when the context changes, which is intentional. Indeed, this
  // context is typically only used in event handlers, but unused during React
  // rendering (except to capture it event handlers), so causing a rerender
  // would be an unnecessary performance hit.
  //
  // This container is an exception, since we do modify the DOM here based on
  // the context.
  //
  const isDragging = useSyncExternalStore(
    (subscriber) => context.subscribe(subscriber),
    () => context.isDragging,
  );

  return (
    <PointerEventsContext.Provider value={context}>
      <div
        style={{
          width: "100%",
          height: "100%",
          pointerEvents: isDragging ? "none" : "inherit", // [1]
        }}
      >
        {children}
      </div>
    </PointerEventsContext.Provider>
  );
  // [1] We use `isDragging` rather than `isClickOrDragging` here, otherwise
  // when we start to drag an hovered but unselected item, the item would
  // temporarily become unhovered between the time we set  `pointer-events =
  // none` (which causes a pointerleave event) and the time the drag threshold
  // is reached, which is when we call `onDragStart`, which may rely on the
  // hover state to know what to drag.
  //
  // Therefore, using isClickOrDragging would not only cause a visual flicker,
  // but in addition, it may break behavior in some cases.
}
