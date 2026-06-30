import { PropsWithChildren } from "react";
import styles from "./Panel.module.css";
import { join } from "../../utils";

export type PanelProps = {
  title: string;
  className?: string;
  noBodyPadding?: boolean;
};

export function Panel({
  title,
  className,
  noBodyPadding,
  children,
}: PropsWithChildren<PanelProps>) {
  const className_ = join(
    styles.Panel,
    className,
    noBodyPadding ? styles.noBodyPadding : undefined,
  );
  return (
    <div className={className_}>
      <h2 className={styles.PanelTitle}>{title}</h2>
      <div className={styles.PanelBody}>{children}</div>
    </div>
  );
}
