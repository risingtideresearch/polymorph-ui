import { ComponentProps } from "react";

import { styled } from "../../utils";
import styles from "./InputIcon.module.css";

export interface InputIconStyleProps {
  red?: boolean;
  green?: boolean;
  yellow?: boolean;
  orange?: boolean;
}

export const InputIconBase = styled.img(styles.InputIcon);

type InputIconProps = ComponentProps<typeof InputIconBase> &
  InputIconStyleProps;

export function InputIcon({
  className,
  red,
  green,
  yellow,
  orange,
  ...rest
}: InputIconProps) {
  const classNames_ = [];
  if (className) classNames_.push(className);
  if (red) classNames_.push(styles.red);
  if (green) classNames_.push(styles.green);
  if (yellow) classNames_.push(styles.yellow);
  if (orange) classNames_.push(styles.orange);
  return <InputIconBase {...rest} className={classNames_.join(" ")} />;
}
