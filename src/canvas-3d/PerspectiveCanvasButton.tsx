import { PerspectiveIcon } from "@phosphor-icons/react";

import { CanvasButton } from "../components/Canvas/Canvas";

interface PerspectiveCanvasButtonProps {
  orthographic: boolean;
  onChange: (orthographic: boolean) => void;
}

/**
 * A canvas button to toggle between orthographic and perspective projections.
 */
export function PerspectiveCanvasButton({
  orthographic,
  onChange,
}: PerspectiveCanvasButtonProps) {
  return (
    <CanvasButton
      active={!orthographic}
      title={orthographic ? "Switch to perspective" : "Switch to orthographic"}
      onClick={() => onChange(!orthographic)}
    >
      <PerspectiveIcon />
    </CanvasButton>
  );
}
