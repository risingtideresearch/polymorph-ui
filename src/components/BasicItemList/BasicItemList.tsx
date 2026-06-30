import styles from "./BasicItemList.module.css";
import { styled } from "../../utils/styled";

/**
 * A simple vertical container for a list of `Item`s, separating them with a
 * `--tiny-gap`.
 *
 * It is "basic" in the sense that it does not virtualize its children (so it is
 * only suitable for small lists), nor does it allow interactive reordering.
 */
export const BasicItemList = styled.div(styles.BasicItemList);
