import { ReactNode, RefObject, useCallback, useRef } from "react";

import {
  Area,
  AreaGroup,
  AreaGroupHandle,
  AreaLayout,
  AreaSeparator,
} from "../Area/Area";
import { join } from "../../utils";

import styles from "./Area2x2Grid.module.css";

export type Area2x2GridProps = {
  /** Content of the top-left cell. */
  topLeft: ReactNode;
  /** Content of the top-right cell. */
  topRight: ReactNode;
  /** Content of the bottom-left cell. */
  bottomLeft: ReactNode;
  /** Content of the bottom-right cell. */
  bottomRight: ReactNode;
  /** Optional class applied to each underlying `AreaGroup`. */
  className?: string;
};

/**
 * A resizable 2x2 grid of four areas.
 *
 * The two rows are independent horizontal `AreaGroup`s, so by default their
 * column splits could drift apart and the layout would stop reading as a 2x2
 * grid. We keep them locked together by mirroring each row's layout onto the
 * other as it resizes. `onLayoutChange` fires synchronously on every pointer
 * move (not just on release), so the rows stay aligned during the drag with no
 * intermediate non-grid frames.
 */
export function Area2x2Grid({
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  className,
}: Area2x2GridProps) {
  const topRef = useRef<AreaGroupHandle | null>(null);
  const bottomRef = useRef<AreaGroupHandle | null>(null);
  // Guards against the mirrored `setLayout` echoing back as another change.
  const syncing = useRef(false);

  const mirror = useCallback(
    (targetRef: RefObject<AreaGroupHandle | null>) => (layout: AreaLayout) => {
      if (syncing.current) return;
      syncing.current = true;
      targetRef.current?.setLayout(layout);
      syncing.current = false;
    },
    [],
  );

  // The same column ids are used in both rows so a row's layout can be mirrored
  // onto the other verbatim. Panel ids only need to be unique within a group.
  const groupClassName = join(styles.Area2x2Grid, className);

  return (
    <AreaGroup className={groupClassName} orientation="vertical">
      <Area>
        <AreaGroup
          className={groupClassName}
          orientation="horizontal"
          groupRef={topRef}
          onLayoutChange={mirror(bottomRef)}
        >
          <Area id="left">{topLeft}</Area>
          <AreaSeparator />
          <Area id="right">{topRight}</Area>
        </AreaGroup>
      </Area>
      <AreaSeparator />
      <Area>
        <AreaGroup
          className={groupClassName}
          orientation="horizontal"
          groupRef={bottomRef}
          onLayoutChange={mirror(topRef)}
        >
          <Area id="left">{bottomLeft}</Area>
          <AreaSeparator />
          <Area id="right">{bottomRight}</Area>
        </AreaGroup>
      </Area>
    </AreaGroup>
  );
}
