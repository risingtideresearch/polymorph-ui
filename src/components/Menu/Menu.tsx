import { PropsWithChildren, ReactNode, useCallback } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { CaretRightIcon } from "@phosphor-icons/react";

import { styled } from "../../utils/styled";
import styles from "./Menu.module.css";

interface MenuProps {
  trigger: ReactNode;
}

export function Menu({
  children,
  trigger = "Menu",
}: PropsWithChildren<MenuProps>) {
  const onCloseAutoFocus = useCallback((event: Event) => {
    // Prevent RadixUI from giving the keyboard focus to the trigger when the
    // menu closes, since this would prevent usage of our global shortcuts.
    event.preventDefault();
  }, []);
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={styles.Content}
          alignOffset={-8}
          align="start"
          sideOffset={10}
          onCloseAutoFocus={onCloseAutoFocus}
        >
          {children}
          <DropdownMenu.Arrow className={styles.Arrow} />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export const MenuTriggerButton = styled.button(styles.TriggerButton);
export const MenuRightSlot = styled.span(styles.RightSlot);
export const MenuSeparator = styled(DropdownMenu.Separator, styles.Separator);
export const MenuItem = styled(DropdownMenu.Item, styles.Item);
export const MenuCheckboxItem = styled(DropdownMenu.CheckboxItem, styles.Item);
export const MenuItemIndicator = styled(
  DropdownMenu.ItemIndicator,
  styles.ItemIndicator,
);

interface SubMenuProps {
  name: string;
}

export function SubMenu({ children, name }: PropsWithChildren<SubMenuProps>) {
  return (
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger className={styles.Item}>
        {name}
        <MenuRightSlot>
          <CaretRightIcon className={`${styles.Caret}`} size={8} />
        </MenuRightSlot>
      </DropdownMenu.SubTrigger>
      <DropdownMenu.Portal>
        <DropdownMenu.SubContent
          className={styles.Content}
          sideOffset={8}
          alignOffset={-8}
        >
          {children}
        </DropdownMenu.SubContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Sub>
  );
}
