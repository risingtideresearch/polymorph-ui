// For now, there are no stories for <Input>, in favor of using <TextInput>

import styles from "./Input.module.css";
import baseStyles from "../InputBase/InputBase.module.css";
import { styled } from "../../utils/styled";

/**
 * A styled <input> element. This is low-level and we recommend using `TextInput`
 * instead in most situations.
 */
export const Input = styled.input(
  `${baseStyles.InputOrSelect} ${styles.Input}`,
);
