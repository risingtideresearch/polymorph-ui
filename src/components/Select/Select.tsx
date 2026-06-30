// For now, there are no stories for <Select>, in favor of using <EnumInput>

import styles from "./Select.module.css";
import baseStyles from "../InputBase/InputBase.module.css";

import * as RS from "@radix-ui/react-select";

import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";

const SelectTriggerStyle = `${baseStyles.InputOrSelect} ${styles.SelectTrigger}`;

/**
 * Provides a way to select a value from a list of options. This must be used
 * together with `Option`, and wrapped in an `InputContainer` for proper styling.
 * Example:
 *
 * ```
 * <InputContainer>
 *   <Select value={value} onChange={setValue}>
 *     <Option value="option1">Option 1</Option>
 *     <Option value="option2">Option 2</Option>
 *   </Select>
 * </InputContainer>
 * ```
 *
 * For convenience, you can also use the `EnumInput` component which is a
 * wrapper around `Select` that takes an enum-like object as options.
 */
export function Select({
  id,
  children,
  onChange,
  value,
}: {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <RS.Root value={value} onValueChange={onChange}>
      <RS.Trigger id={id} className={SelectTriggerStyle}>
        <RS.Value />
        <RS.Icon className={styles.SelectIcon}>
          <CaretDownIcon />
        </RS.Icon>
      </RS.Trigger>

      <RS.Portal>
        <RS.Content className={styles.SelectContent}>
          <RS.ScrollUpButton />
          <RS.Viewport>{children}</RS.Viewport>
          <RS.ScrollDownButton />
          <RS.Arrow />
        </RS.Content>
      </RS.Portal>
    </RS.Root>
  );
}

// Note: Unlike radix Select.Item, we prefer to call it "Option" as it better
// matches the HTML <option> terminology, and avoid any possible confusion with
// our "Item" component.
//
export function SelectOption({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <RS.Item value={value} className={styles.SelectItem}>
      <RS.ItemText>{children}</RS.ItemText>
      <RS.ItemIndicator className={styles.SelectItemIndicator}>
        <CheckIcon />
      </RS.ItemIndicator>
    </RS.Item>
  );
}
