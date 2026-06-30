import {
  useCallback,
  useEffect,
  useRef,
  useState,
  ComponentProps,
} from "react";
import { Label } from "../Item/Item";
import { TextInput } from "../TextInput/TextInput";

import styles from "./EditableLabel.module.css";

interface EditableLabelProps extends ComponentProps<"div"> {
  value: string;
  setValue: (value: string) => void;
  onEditingChange?: (isEditing: boolean) => void;
}

export function EditableLabel({
  value,
  setValue,
  onEditingChange,
  ...rest
}: EditableLabelProps) {
  const [isEditing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = useCallback(() => {
    setEditing(true);
    onEditingChange?.(true);
  }, [onEditingChange]);

  const stopEditing = useCallback(() => {
    setEditing(false);
    onEditingChange?.(false);
  }, [onEditingChange]);

  useEffect(() => {
    // Select the content of the TextInput when we start editing.
    //
    // Note: this cannot be done in `startEditing` as the TextInput doesn't
    // exist yet when `startEditing` is called.
    //
    if (isEditing && inputRef.current) {
      if (document.activeElement !== inputRef.current) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div className={styles.EditableLabelContainer} {...rest}>
        <TextInput
          ref={inputRef}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          value={value}
          onTextChange={setValue}
          onBlur={stopEditing}
        />
      </div>
    );
  } else {
    return (
      <div className={styles.EditableLabelContainer} {...rest}>
        <Label className={styles.EditableLabel} onDoubleClick={startEditing}>
          {value}
        </Label>
      </div>
    );
  }
}
