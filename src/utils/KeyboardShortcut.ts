import { KeyboardModifiers } from "./KeyboardModifiers";

/**
 * Represents a keyboard shortcut.
 */
export class KeyboardShortcut {
  readonly modifiers: KeyboardModifiers;
  readonly key: string;
  readonly str: string;
  readonly prettyStr: string;
  readonly keyCode: string;

  /**
   * Creates a keyboard shortcut from a string.
   *
   * Example:
   *
   * ```
   * const copyShortcut = new KeyboardShortcut("CtrlCmd+C");
   * ```
   *
   * The input must be of the form "{mod1}+{mod2}+...+{key}", where allowed
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
   * and where the key should correspond to a key value from
   * KeyboardEvent, see:
   *
   * - https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
   */
  constructor(str: string) {
    this.modifiers = new KeyboardModifiers(str);
    this.key = "";
    this.str = "";
    this.prettyStr = "";
    this.keyCode = "";

    // Remove all whitespace characters
    str = str.replace(/\s/g, "");

    // Extract the key.
    //
    // If the string is empty, there is no key nor modifiers (= no shortcut).
    // If the string ends in `+`, then the key itself is assumed to be `+`.
    //
    // For reference, here is the behavior of `split` for various examples,
    // which explains the implementation that follows:
    //
    // ""       => [""]
    // "C"      => ["C"]
    // "Ctrl+C" => ["Ctrl", "C"]
    // "+"      => ["", ""]
    // "Ctrl+"  => ["Ctrl", ""]
    // "Ctrl++" => ["Ctrl", "", ""]
    //
    const tokens = str.split("+");
    if (tokens.length === 0) {
      return;
    }
    if (tokens.length === 1) {
      this.key = tokens[0];
    }
    if (tokens[tokens.length - 1] === "" && tokens[tokens.length - 2] === "") {
      this.key = "+";
    } else {
      this.key = tokens[tokens.length - 1];
    }

    // Always capitalize one-character keys. See `matches()` for rationale.
    //
    if (this.key.length === 1) {
      this.key = this.key.toUpperCase();
    }

    this.str = this.modifiers.str
      ? this.modifiers.str + "+" + this.key
      : this.key;
    this.prettyStr = this.modifiers.prettyStr
      ? this.modifiers.prettyStr + " " + this.key
      : this.key;

    if (/^[A-Z]$/.test(this.key)) {
      this.keyCode = `Key${this.key}`;
    } else if (/^[0-9]$/.test(this.key)) {
      this.keyCode = `Digit${this.key}`;
    } else {
      this.keyCode = this.key;
    }
  }

  /**
   * Returns whether this shortcut matches the given keyboard event.
   *
   * Note that this means an exact match, for example if the user presses
   * Ctrl+Shift+Z, then `new KeyboardShortcut("Ctrl+Z").matches(event)` is
   * false.
   */
  matches(event: {
    key: string;
    code: string;
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
  }) {
    // When pressing <A> on the keyboard, the returned event.key is "a".
    // When pressing <Shift><A> on the keyboard, the returned even.key is "A".
    //
    // So unless event.key is a named key
    // ("Delete", "Enter", "Tab", "Escape", etc.), which always have more
    // than one character, we capitalize `event.key` to match our internal
    // key. Note that one-character keys also include things
    // like " ", "1", "+", ".", "#", etc., but this is fine since
    // capitalizing them is a no-op.
    //
    let eventKey = event.key;
    if (eventKey.length === 1) {
      eventKey = eventKey.toUpperCase();
    }

    // We check both the keyCode and the key as this seems to properly handle most typical scenarios.
    //
    // For example, depending on keyboard layout and OS:
    // - "Shift+2" might return the key "@"
    // - "Shift+Alt+O" might returns the key "Ø"
    //
    // However, this means that there might be some conflicts. for example if both "Shift+2" and "@"
    // are defined as shortcuts for different actions. For now, it is the responsibility of actions
    // to try to avoid these conflicts.
    //
    return (
      (event.code === this.keyCode || eventKey === this.key) &&
      this.modifiers.matches(event)
    );
  }
}
