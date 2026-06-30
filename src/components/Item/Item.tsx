import { ComponentProps } from "react";

import { styled } from "../../utils";
import styles from "./Item.module.css";

export interface ItemStyleProps {
  isHovered?: boolean;
  isSelected?: boolean;
  isActive?: boolean;
  noGap?: boolean;
  tinyGap?: boolean;
}

export const ItemBase = styled.div(styles.Item);

type ItemProps = ComponentProps<typeof ItemBase> & ItemStyleProps;

/**
 * An "Item" is a small container component meant to represent a single item in
 * a vertical list of items. It has a fixed height given by the CSS variable
 * `--item-height`, which helps maintain a consistent layout and optimize via
 * virtualization (only rendering visible items).
 *
 * It often has different states such as hovered, selected, or active.
 *
 * Its children are typically layed out horizontally, separated by a small gap,
 * and ensuring that their text shares the same baseline.
 */
export function Item({
  className,
  isHovered,
  isSelected,
  isActive,
  noGap,
  tinyGap,
  ...rest
}: ItemProps) {
  const classNames_ = [];
  if (className) classNames_.push(className);
  if (isHovered) classNames_.push(styles.isHovered);
  if (isSelected) classNames_.push(styles.isSelected);
  if (isActive) classNames_.push(styles.isActive);
  if (noGap) classNames_.push(styles.noGap);
  if (tinyGap) classNames_.push(styles.tinyGap);
  return <ItemBase {...rest} className={classNames_.join(" ")} />;
}

export interface HoverZoneStyleProps {
  withPadding?: boolean;
}

export const HoverZoneBase = styled.div(styles.HoverZone);

type HoverZoneProps = ComponentProps<typeof HoverZoneBase> &
  HoverZoneStyleProps;

export function HoverZone({ className, withPadding, ...rest }: HoverZoneProps) {
  const classNames_ = [];
  if (className) classNames_.push(className);
  if (withPadding) classNames_.push(styles.withPadding);
  return <HoverZoneBase {...rest} className={classNames_.join(" ")} />;
}

export const ExtraZone = styled.div(styles.ExtraZone);
export const SecretZone = styled.div(styles.SecretZone);

export const Label = styled.p(styles.Label);
export const Button = styled.button(styles.Button);
export const SingleCharacterButton = styled(
  Button,
  styles.SingleCharacterButton,
);

export const SingleCharacterButtonSpace = styled.div(
  styles.SingleCharacterButtonSpace,
);
