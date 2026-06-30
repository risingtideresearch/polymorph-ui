import { ComponentPropsWithRef } from "react";
import { IconContext } from "@phosphor-icons/react";

import { join, styled } from "../../utils";
import styles from "./Canvas.module.css";

export const CanvasFrame = styled.div(styles.CanvasFrame);
export const CanvasLabel = styled.span(styles.CanvasLabel);

const CanvasControlsContainer = styled.div(styles.CanvasControls);

// Default props for icons rendered inside `CanvasControls`, so that callers
// don't need to specify a size on every icon.
const canvasIconContext = { size: 14 };

export function CanvasControls({
  children,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <CanvasControlsContainer {...props}>
      <IconContext.Provider value={canvasIconContext}>
        {children}
      </IconContext.Provider>
    </CanvasControlsContainer>
  );
}

interface CanvasButtonProps extends ComponentPropsWithRef<"button"> {
  readonly active?: boolean;
  // Nudge the icon by half a pixel so that strokes which would otherwise
  // straddle a pixel boundary at even icon sizes render crisply. Use this for
  // symmetric icons centered on their midpoint (e.g. `PlusIcon`) at the default
  // 14px size; at odd sizes the half-pixel offset is already there for free.
  readonly oddAdjust?: boolean;
}

export function CanvasButton({
  active = false,
  oddAdjust = false,
  className,
  ...props
}: CanvasButtonProps) {
  return (
    <button
      {...props}
      className={join(
        styles.CanvasButton,
        active ? styles.active : undefined,
        oddAdjust ? styles.oddAdjust : undefined,
        className,
      )}
    />
  );
}
