import { useState, useCallback, useRef } from "react";
import { TextInput } from "../TextInput/TextInput";

import { usePointerEvents } from "../../hooks";
import { IPointerEvent, join } from "../../utils";

import styles from "./NumberInput.module.css";

export interface NumberInputProps<T> {
  idBase?: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  onDragStart?: (value: number) => T;
  onDragMove?: (value: number, data: T) => void;
  onDragEnd?: (data: T) => void;
  min?: number;
  max?: number;
}

// While typing, a number should contain zero or more digits, zero or one ".",
// and optionally starts with either "+" or "-".
//
const numberPattern = "[+-]?[0-9]*[.]?[0-9]*";
const onInputPattern = `^${numberPattern}$`;

// When complete, a number should contain one or more digits, zero or one ".",
// and optionally starts with either "+" or "-".
//
const atLeastOneDigit = "(?=.*[0-9])"; // non-consuming regexp used as "and" operator
const onChangePattern = `^${atLeastOneDigit}${numberPattern}$`;

const onChangeRegex = new RegExp(onChangePattern);

interface DragData<T> {
  x: number;
  y: number;
  oldValue: number;
  data: T | undefined;
}

export function NumberInput<T = undefined>({
  idBase,
  label,
  value,
  onChange,
  onDragStart,
  onDragMove,
  onDragEnd,
  min,
  max,
}: NumberInputProps<T>) {
  const [isTypingMode, setTypingMode] = useState(false);

  const onChangeValidator = useCallback(
    (s: string): [boolean, string?] => {
      if (onChangeRegex.test(s)) {
        const value = Number(s);
        if (min !== undefined && value < min) {
          return [false, min.toString()];
        }
        if (max !== undefined && value > max) {
          return [false, max.toString()];
        }
        return [true];
      } else {
        // On commit, we convert any invalid number to zero.
        //
        // Note that since all input values already satisfy the onInputPattern,
        // the only possible change-invalid but input-valid values that we
        // convert to 0 are: "", ".", "+", "-".
        //
        return [false, "0"];
      }
    },
    [min, max],
  );

  const onTextChange = useCallback(
    (text: string) => {
      let newValue = parseFloat(text);
      if (isNaN(newValue)) {
        newValue = 0;
      }
      onChange(newValue);
    },
    [onChange],
  );

  const inputRef = useRef<HTMLInputElement>(null);

  const onHover = useCallback(() => {}, []);

  const hasDrag_ = useCallback(
    (event: IPointerEvent): { current?: DragData<T> } | undefined => {
      if (isTypingMode || event.button !== 0) {
        return;
      }
      return { current: undefined };
    },
    [isTypingMode],
  );

  const onDragStart_ = useCallback(
    (event: IPointerEvent, dataRef: { current?: DragData<T> }): void => {
      if (isTypingMode) {
        return;
      }
      const dragData = onDragStart ? onDragStart(value) : undefined;
      dataRef.current = {
        x: event.clientX,
        y: event.clientY,
        oldValue: value,
        data: dragData,
      };
    },
    [isTypingMode, value, onDragStart],
  );

  const onDragMove_ = useCallback(
    (event: IPointerEvent, dataRef: { current?: DragData<T> }) => {
      const data = dataRef.current;
      if (!data) {
        return;
      }

      // We use both horizontal offset and vertical offset so that it can be
      // dragged vertically if at the left/right edge of the screen, and
      // horizontally if at the top/bottom edge of the screen.
      //
      // We use the dx + dy rather than max(dx, dy) so that user can learn that
      // dragging vertically is possible too, despite the shown cursor being an
      // horizontal double-arrow.
      //
      const dx = event.clientX - data.x; // dragging to the right increases value
      const dy = data.y - event.clientY; // dragging to the top increases value
      let delta = dx + dy;
      if (min !== undefined && max !== undefined) {
        // 200px to cover the whole range
        delta *= (max - min) / 200;
      }
      let newValue = data.oldValue + delta;
      if (min !== undefined && newValue < min) {
        newValue = min;
      }
      if (max !== undefined && newValue > max) {
        newValue = max;
      }
      if (onDragMove && data.data) {
        onDragMove(newValue, data.data);
      } else {
        onChange(newValue);
      }
    },
    [onChange, onDragMove, min, max],
  );

  const onDragEnd_ = useCallback(
    (_event: IPointerEvent, dataRef: { current?: DragData<T> }) => {
      const data = dataRef.current;
      if (!data) {
        return;
      }
      if (onDragEnd && data.data) {
        onDragEnd(data.data);
      }
    },
    [onDragEnd],
  );

  const onClick = useCallback(() => {
    if (isTypingMode) {
      return;
    }
    setTypingMode(true);
    const input = inputRef.current;
    if (input) {
      input.select();
    }
  }, [isTypingMode]);

  const pointerEvents = usePointerEvents({
    elementRef: inputRef,
    preventDefault: !isTypingMode,
    onHover: onHover,
    hasDrag: hasDrag_,
    onDragStart: onDragStart_,
    onDragMove: onDragMove_,
    onDragEnd: onDragEnd_,
    onClick: onClick,
  });

  // Note: we prefer not to add the "readonly" attribute to the <input> even
  // when isTypingMode is false, since semantically we consider the number
  // to be modifiable.

  return (
    <TextInput
      ref={inputRef}
      idBase={idBase}
      label={label}
      className={join(
        styles.NumberInput,
        isTypingMode ? undefined : styles.scrubMode,
      )}
      role="spinbutton"
      onInputPattern={onInputPattern}
      onChangePattern={onChangeValidator}
      inputMode="decimal"
      autoComplete="off"
      autoCorrect="off"
      spellCheck="false"
      aria-roledescription="numberfield"
      aria-valuemin={min ?? -9007199254740991}
      aria-valuemax={max ?? 9007199254740991}
      aria-valuenow={value}
      value={value.toString()}
      onTextChange={onTextChange}
      onBlur={() => {
        setTypingMode(false);
      }}
      {...pointerEvents}
    />
  );
}

export default NumberInput;
