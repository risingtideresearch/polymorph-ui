// This file contains shared styling and components for "input components" (e.g., Input, Select).
// It does not have associated stories, as these are not meant to be used independently.

import styles from "./InputBase.module.css";
import { styled } from "../../utils/styled";

/**
 * Container to use around `Input` or `Select` for proper styling.
 *
 * Examples:
 *
 * ```
 * <InputContainer>
 *   <InputLabel>Name</InputLabel>
 *   <Input />
 * </InputContainer>
 * ```
 *
 * ```
 * <InputContainer>
 *   <InputLabel>Alignment</InputLabel>
 *   <Select>
 *     <SelectOption value="left">Left</SelectOption>
 *     <SelectOption value="center">Center</SelectOption>
 *     <SelectOption value="right">Right</SelectOption>
 *   </Select>
 * </InputContainer>
 * ```
 */
export const InputContainer = styled.div(styles.InputContainer);

const InputLabelBase = styled.label(styles.InputLabel);

/**
 * Provides a companion label for an `Input` or `Select` component. See
 * `InputContainer` for usage examples.
 */
export function InputLabel({
  children,
  idBase,
  className,
}: {
  children?: React.ReactNode;
  idBase?: string;
  className?: string;
}) {
  if (!children) return null;

  return (
    <InputLabelBase
      className={className}
      data-scope="text-input"
      data-part="label"
      dir="ltr"
      id={idBase && `${idBase}::label`}
      htmlFor={idBase && `${idBase}::input`}
    >
      {children}
    </InputLabelBase>
  );
}
