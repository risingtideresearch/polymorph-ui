import { ThreeEvent } from "@react-three/fiber";
import { useCallback, useRef } from "react";

import { usePointerEventsContext } from "../contexts";

export interface Use3DPointerEventsProps {
  onEnter?: (event: ThreeEvent<MouseEvent>) => void;
  onLeave?: (event: ThreeEvent<MouseEvent>) => void;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
}

/**
 * Defines pointer event handlers for 3D objects to manage hover, click, and
 * drag state. Unlike using raw handlers like onClick, it prevents conflicts
 * between separate events such as not allowing clicks in the middle of drags,
 * and suppressing pointer enter events during click-or-drag operations.
 *
 * It reads the click-or-drag state from the shared `PointerEventsContext`, so
 * it is mutually exclusive with any other interaction arbitrated by that
 * context, including orbiting the 3D canvas (see `Canvas3DOrbitControls`) and
 * dragging area separators or 2D canvases elsewhere in the app.
 */
export function use3DPointerEvents({
  onEnter,
  onLeave,
  onClick,
}: Use3DPointerEventsProps) {
  const context = usePointerEventsContext();
  const entered = useRef(false);
  const downButton = useRef<number | null>(null);

  const maybeEnter = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (entered.current) {
        // Already entered, nothing to do
        return;
      }
      if (context.isClickOrDragging) {
        // Suppress pointer enter during click-or-drag
        return;
      }
      entered.current = true;
      onEnter?.(e);
    },
    [onEnter, context],
  );

  const doLeave = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!entered.current) {
        // Not entered, nothing to do
        return;
      }
      entered.current = false;
      onLeave?.(e);
    },
    [onLeave],
  );

  const maybeLeave = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!entered.current) {
        // Not entered, nothing to do
        return;
      }
      if (context.isDragging) {
        // Leave now if click-or-drag resolved to a drag
        doLeave(e);
      }
    },
    [doLeave, context],
  );

  return {
    onPointerDown: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (downButton.current === null) {
        downButton.current = e.button;
      }
    },
    onPointerUp: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (downButton.current !== e.button) {
        return;
      }
      downButton.current = null;
      onClick?.(e);
    },
    onPointerMove: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      maybeEnter(e);
      maybeLeave(e);
      if (context.isDragging) {
        // Abort click if click-or-drag already resolved to a drag
        downButton.current = null;
      }
    },
    onPointerEnter: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      maybeEnter(e);
    },
    onPointerLeave: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      doLeave(e);
    },
  };
}
