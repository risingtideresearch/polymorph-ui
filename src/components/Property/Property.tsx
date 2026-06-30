import { PropsWithChildren } from "react";

import styles from "./Property.module.css";
import { styled } from "../../utils/styled";

export interface PropertyProps {
  name: string;
}

export function Property({ name, children }: PropsWithChildren<PropertyProps>) {
  const nameWithColon = `${name}:`;
  return (
    <>
      <p className={styles.PropertyName}>{nameWithColon}</p>
      <div className={styles.PropertyValue}>{children}</div>
    </>
  );
}

export const PropertyGrid = styled.div(styles.PropertyGrid);
