import { ComponentProps } from "react";
import styles from "./StoryContainer.module.css";

interface StoryContainerProps extends ComponentProps<"div"> {
  withPadding?: boolean;
}

/**
 * A container used to wrap some Storybook stories so they look good with
 * consistent background color, border radius, etc.us so they look good and
 * consistent.
 *
 * Note that not all stories need to be wrapped in this, which is why it's not
 * set more globally in Storybook's preview.tsx.
 */
export function StoryContainer({
  withPadding,
  style,
  ...props
}: StoryContainerProps) {
  return (
    <div
      className={styles.StoryContainer}
      style={withPadding ? { padding: "var(--padding)", ...style } : style}
      {...props}
    />
  );
}
