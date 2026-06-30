import { PanelProps as AreaProps } from "react-resizable-panels";
import { Panel, Separator, Group } from "react-resizable-panels";

import styles from "./Area.module.css";
import { styled } from "../../utils/styled";

export {
  type PanelProps as AreaProps,
  type GroupImperativeHandle as AreaGroupHandle,
  type Layout as AreaLayout,
} from "react-resizable-panels";

export const AreaGroup = styled(Group, styles.AreaGroup);

export function Area(props: AreaProps) {
  return <Panel minSize="30px" {...props} />;
}

export const AreaSeparator = Separator;
