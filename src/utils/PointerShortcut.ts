import { KeyboardModifiers } from "../utils/KeyboardModifiers";

/**
 * Represents a pointer shortcut.
 */
export class PointerShortcut {
  readonly modifiers: KeyboardModifiers;
  readonly button: number;
  readonly str: string;
  readonly prettyStr: string;

  /**
   * Creates a pointer shortcut from a string.
   *
   * Example:
   *
   * ```
   * const zoom = new PointerShortcut("CtrlCmd+LeftButton");
   * ```
   *
   * The input must be of the form "{mod1}+{mod2}+...+{button}", where allowed
   * modifiers are:
   *
   * - "Ctrl"  (Ctrl on Windows, Control on Mac)
   * - "Alt"   (Alt on Windows, Option on Mac)
   * - "Shift" (Shift on Windows, Shift on Mac)
   * - "Meta"  (Win on Windows, Command on Mac)
   *
   * - "CtrlCmd" (Ctrl on Windows, Command on Mac)
   * - "WinCtrl" (Win on Windows, Control on Mac)
   *
   * and where allowed pointer buttons are:
   *
   * - "LeftButton"
   * - "MiddleButton"
   * - "RightButton"
   */
  constructor(str: string) {
    this.modifiers = new KeyboardModifiers(str);
    this.button = 0;
    this.str = "";
    this.prettyStr = "";

    // Remove all whitespace characters
    str = str.replace(/\s/g, "");

    // Extract the pointer button as string.
    const tokens = str.split("+");
    const buttonStr = tokens.length > 0 ? tokens[tokens.length - 1] : "";
    switch (buttonStr) {
      case "LeftButton":
        this.button = 0;
        break;
      case "MiddleButton":
        this.button = 1;
        break;
      case "RightButton":
        this.button = 2;
        break;
    }

    this.str = this.modifiers.str
      ? this.modifiers.str + "+" + buttonStr
      : buttonStr;
    this.prettyStr = this.modifiers.prettyStr
      ? this.modifiers.prettyStr + " " + buttonStr
      : buttonStr;
  }

  /**
   * Returns whether this shortcut matches the given pointer event.
   *
   * Note that this means an exact match, for example if the user clicks via
   * Ctrl+Shift+LeftButton, then `new PointerShortcut
   * ("Ctrl+LeftButton").matches(event)` is false.
   */
  matches(event: {
    button: number;
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
  }) {
    return event.button === this.button && this.modifiers.matches(event);
  }
}
