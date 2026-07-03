import {
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
  InputHTMLAttributes,
  KeyboardEvent,
} from "react";

import { useInputIdBase } from "../../hooks";
import { Pattern, stringValidatorFromPattern } from "../../utils/Pattern";

import { InputLabel, InputContainer } from "../InputBase/InputBase";
import { Input } from "../Input/Input";

// Note: according to spec, the argument of an `input` event is an
// `InputEvent`, and the argument of a `change` event is a generic `Event`,
// see:
//
// - https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event
// - https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event
//
// In practice, for "text" input, an `InputEvent` is indeed used, but on "range" input,
// a generic `Event` is used. Therefore, it should be typed as a generic `Event`. See:
//
// - https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/1174#issuecomment-933042088
//
// For convenience, we could implement a more specific `TextInput` component wrapping this `Input` component,
// that dynamically checks that the event is an `InputEvent`, and expect its `onInput` prop to take an
// `InputEvent` argument.
//
type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "onInput" | "ref" | "type"
> & {
  // New properties not existing in React's <input>
  onInputPattern?: Pattern;
  onChangePattern?: Pattern;

  // These events have a different signature in React's <input>
  onChange?: (event: Event, input: HTMLInputElement) => void;
  onInput?: (event: Event, input: HTMLInputElement) => void;

  // These are more convenient versions of `onChange` and `onInput`, directly
  // providing the new text value rather than the event and HTML input
  // element. `onTextChange` is fired immediately after `onChange`, and
  // `onTextInput` is fired immediately after `onInput`.
  onTextChange?: (text: string) => void;
  onTextInput?: (text: string) => void;

  // We need to explictly call this and thus do not use React's event signature.
  onBlur?: () => void;

  // React's <input> also allows `value` to have type `undefined`, `readonly
  // string[]` or `number`, but we don't.
  value: string;

  label?: string;
  idBase?: string;
};

interface InputState {
  value: string;
  selectionStart: number | null;
  selectionEnd: number | null;
  selectionDirection: "forward" | "backward" | "none" | null;
}

function saveInputState(input: HTMLInputElement, state: InputState) {
  state.value = input.value;
  state.selectionStart = input.selectionStart;
  state.selectionEnd = input.selectionEnd;
  state.selectionDirection = input.selectionDirection;
}

function restoreInputState(input: HTMLInputElement, state: InputState) {
  input.value = state.value;
  input.setSelectionRange(
    state.selectionStart,
    state.selectionEnd,
    state.selectionDirection ?? undefined,
  );
}

const defaultInputState: InputState = {
  value: "",
  selectionStart: null,
  selectionEnd: null,
  selectionDirection: null,
};

/**
 * This component is a wrapper around React's <input type="text"> component,
 * adding support for the JS-native `onchange` event and more advanced
 * pattern-enforcement.
 *
 * Indeed, by default, React's <input> component maps both `onChange` and
 * `onInput` to the JS `oninput` event, which means that they are redundant
 * and are both fired at each keystroke. Instead, in this component, the
 * `onChange` event is only fired when the change is "commited" (e.g., the
 * user presses Enter or the input loses focus), as specified by JavaScript.
 *
 * Note that an alternative workaround sometimes used by developers is to use
 * `onBlur` instead of `onChange`. Unfortunately, such workaround is not
 * enough: we want the `onChange` callback to be fired when the user presses
 * Enter, which is not the case when using `onBlur`.
 *
 * See:
 * - https://stackoverflow.com/a/62383569
 * - https://reactjs.org/docs/dom-elements.html#onchange
 * - https://github.com/facebook/react/issues/3964
 * - https://github.com/facebook/react/issues/9657
 * - https://github.com/facebook/react/issues/14857
 *
 * If `onInputPattern` is provided, then each time the user edits the text
 * input, the new value is checked against the pattern. If it does not pass
 * the pattern, then the value is changed back to the last known valid value
 * (either committed or uncommitted). Then `onInput` is called if provided.
 *
 * If `onChangePattern` is provided, then each time the user attempts to
 * commit the text input, the new value is checked against the pattern. If it
 * does not pass the pattern, then the value is not committed and instead
 * reverted back the the last committed valid value (same behavior as
 * hitting "Escape"). If the value passes the pattern, it is committed, and
 * `onChange` is called if provided.
 *
 * Note that you often want `onInputPattern` and `onChangePattern` to be
 * slightly different. For example, for inputing integers, users need to be
 * allowed to temporarily type "-" (which is not a valid number), before
 * typing out the rest of the valid integer "-42". So you can use:
 *
 * - onInputPattern  = "^[+-]?[0-9]*$"
 * - onChangePattern = "^[+-]?[0-9]+$"
 */
export const TextInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const {
    onInput,
    onChange,
    onTextInput,
    onTextChange,
    onInputPattern,
    onChangePattern,
    value,
    label,
    idBase,
    onBlur,
    ...otherProps
  } = props;

  // Reference to the underlying DOM's <input>
  const inputRef = useRef<HTMLInputElement>(null);

  // Expose the internal ref to the parent component
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  // Remember the value and selection of the last known "semi-valid" state
  // (that is, that satisfies the onInputPattern). We need this for reverting
  // input state when the user just typed (or pasted) something that doesn't
  // satisfy the onInputPattern.
  //
  const lastKnownSemiValidState = useRef<InputState>(defaultInputState);

  // Update input value if:
  // - props.value changed, or
  // - an event has just been processed (which increases an internal `version`)
  //
  // The `version` is important in order to handle the following scenario:
  //
  // 1. Initially, props.value = "1" with an onChange event.
  //
  // 2. Then the user types "1.0" in the input and hits Enter.
  //
  // 3. The onChange event is processed, which receives the new value "1.0",
  //    but decides as a result that the final value should still be "1" anyway
  //    (e.g., automatic formatter, pattern validation, etc.).
  //
  // 4. Therefore, `props.value` is equal to "1" on the next render.
  //
  // Notice how in this scenario, `props.value` never changes: it stays at "1"
  // the whole time. So without the internal `version`, the useEffect would
  // not be called, and the input would still incorrectly show "1.0".
  //
  // Essentially, the difficulty lies in the browser state being mutable
  // (the DOM's `input.value`) which does not play well with React immutable
  // design. Using a version is a workaround to reconcile the two approaches
  // that works well in practice.
  //
  const versionRef = useRef(0);
  const version = versionRef.current;

  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.value = value;
      saveInputState(input, lastKnownSemiValidState.current);
    }
  }, [value, version]);

  // We need to both call `input.blur()` and explicitly call the user-provided
  // onBlur() because in some cases, for example when alt-tabbing, the
  // React's built-in <input onBlur> callback is NOT called despite
  // `input.blur()` being called.
  //
  // Wihtout our fix below, this would cause state inconsistencies, such as an
  // EditableLabel staying in editable state, despite the input having lost
  // focus after alt-tabbing.
  //
  const blur = useCallback(() => {
    inputRef.current?.blur();
    onBlur?.();
  }, [onBlur]);

  // Add "onchange" event listener.
  //
  useEffect(() => {
    const input = inputRef.current;
    if (input && (onChange || onTextChange || onChangePattern)) {
      const validator = stringValidatorFromPattern(onChangePattern);
      const listener = (e: Event) => {
        let newValue = input.value;
        const [isValid, suggestion] = validator(newValue);
        if (isValid || suggestion !== undefined) {
          if (suggestion !== undefined) {
            // Make the string valid using the validator's suggestion
            input.value = suggestion;
            newValue = suggestion;
            saveInputState(input, lastKnownSemiValidState.current);
          }
          if (onChange) {
            onChange(e, input);
            versionRef.current += 1;
          }
          if (onTextChange) {
            onTextChange(newValue);
            versionRef.current += 1;
          }
        } else {
          // Committing an invalid value has the same behavior as cancelling the edit.
          // This is important especially since "onchange" can be called as a result
          // of clicking out of the text input, in which case the text input is not
          // focused anymore, and we do not want to leave it in an invalid state.
          //
          input.value = value;
          saveInputState(input, lastKnownSemiValidState.current);
        }

        // We always blur on committed change, whether valid or invalid.
        // Indeed, when invalid, we want to behave like "Escape". When valid,
        // then typically either the input is already blurred anyway, or the
        // user pressed Enter. In the latter case, we assume that the user is
        // usually not going to be modifying the input just after, and that
        // they prefer to get global shortcut available instantly without
        // having to do an extra click outside the input. Example:
        // double-clicking on a text input to select all, type the new value,
        // hit Enter, then hit Ctrl+S.
        //
        blur();
      };
      input.addEventListener("change", listener);
      return () => {
        input.removeEventListener("change", listener);
      };
    }
    return undefined;
  }, [value, onChange, onTextChange, onChangePattern, blur]);

  // Add "oninput" event listener.
  //
  useEffect(() => {
    const input = inputRef.current;
    if (input && (onInput || onTextInput || onInputPattern)) {
      const validator = stringValidatorFromPattern(onInputPattern);
      const listener = (e: Event) => {
        const newValue = input.value;
        const [isValid, suggestion] = validator(newValue);
        if (isValid || suggestion !== undefined) {
          if (suggestion !== undefined) {
            // Make the string valid using the validator's suggestion
            input.value = suggestion;
          }
          saveInputState(input, lastKnownSemiValidState.current);
          if (onInput) {
            onInput(e, input);
            versionRef.current += 1;
            // Note: we intentionally keep the version unchanged if `onInput`
            // is not provided. Indeed, the rationale for using a version is
            // to handle the case where the parent component intentionally
            // keeps `props.value` unchanged despite being aware of a change
            // via the callback, in which case we want `input.value` to be
            // reverted to `props.value`. But if there is no `onInput`
            // callback, the parent component cannot know that `input.value`
            // changed, so obviously `props.value` will be unchanged, but
            // without the intention to override the current `input.value`.
          }
          if (onTextInput) {
            onTextInput(newValue);
            versionRef.current += 1;
          }
        } else {
          restoreInputState(input, lastKnownSemiValidState.current);
        }
      };
      input.addEventListener("input", listener);
      return () => {
        input.removeEventListener("input", listener);
      };
    }
    return undefined;
  }, [onInput, onTextInput, onInputPattern]);

  // Add "onselectionchange" event listener.
  //
  // Example of scenario why this is needed:
  //
  // 1. User types "1234". The caret position is now at the end.
  // 2. User move the caret between the "2" and "3"
  // 3. User types "A"
  //
  // Desired output:
  //
  //   The input should stay "1234" with the caret between the "2" and "3".
  //
  // Without this event listener:
  //
  //   The caret would jump back to the end, which would the last known state
  //   if we only saved state when the "oninput" event is fired.
  //
  // Note that "onselectionchange" is fairly recent with broad browser support
  // only since 2024, which is why we check browser support first. See:
  //
  // - https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/selectionchange_event
  //
  useEffect(() => {
    const input = inputRef.current;
    if (input && "onselectionchange" in input) {
      const listener = () => {
        saveInputState(input, lastKnownSemiValidState.current);
      };
      input.addEventListener("selectionchange", listener);
      return () => {
        input.removeEventListener("selectionchange", listener);
      };
    }
    return undefined;
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      const input = inputRef.current;
      if (!input) {
        return;
      }

      // On Escape, revert changes and lose focus.
      //
      if (event.key === "Escape") {
        input.value = value;
        saveInputState(input, lastKnownSemiValidState.current);
        blur();
      }

      // On Enter, lose focus.
      //
      // In most cases, this is already handled by the "onchange" event
      // handler. But in the specific case where the user presses "Enter"
      // with the same value as the last committed value, "onchange" is not
      // emitted. This is why we need to explicitly blur() on Enter here.
      //
      else if (event.key === "Enter") {
        blur();
      }
    },
    [value, blur],
  );

  // Automatically create a unique idBase if not explicitly provided.
  const _idBase = useInputIdBase(idBase);

  return (
    <InputContainer id={_idBase} dir="ltr">
      <InputLabel idBase={_idBase}>{label}</InputLabel>
      <Input
        {...otherProps}
        data-scope="text-input"
        data-part="input"
        dir="ltr"
        id={`${_idBase}::input`}
        ref={inputRef}
        type="text"
        value={undefined}
        onChange={undefined}
        onInput={undefined}
        onKeyDown={onKeyDown}
        onBlur={blur}
      />
    </InputContainer>
  );
});
