export function isMacPlatform() {
  // Note: `navigator.platform` is deprecated. An alternative might be to use
  // `navigator.userAgent.includes('Mac')`, but it feels more
  // correct/specific to use `platform` rather than `userAgent`.
  return (
    navigator.platform.indexOf("Mac") === 0 || navigator.platform === "iPhone"
  );
}

export class KeyboardModifiers {
  readonly ctrl: boolean;
  readonly shift: boolean;
  readonly alt: boolean;
  readonly meta: boolean;

  readonly str: string;
  readonly prettyStr: string;

  /**
   * Creates a keyboard modifiers from a shortcut string.
   *
   * Example:
   *
   * ```
   * const modifiers = new KeyboardModifiers("CtrlCmd+Shift+V");
   * ```
   *
   * Output on Windows/Linux:
   *
   * ```
   * {
   *   ctrl: true,
   *   shift: true,
   *   alt: false,
   *   meta: false,
   * }
   * ```
   *
   * Output on Mac:
   *
   * ```
   * {
   *   ctrl: false,
   *   shift: true,
   *   alt: false,
   *   meta: true,
   * }
   * ```
   *
   * The input must be of the form "{mod1}+..+{modN}" or "{mod1}+..+{modN}+{other}",
   * where allowed modifiers are:
   *
   * - "Ctrl"  (Ctrl on Windows, Control on Mac)
   * - "Alt"   (Alt on Windows, Option on Mac)
   * - "Shift" (Shift on Windows, Shift on Mac)
   * - "Meta"  (Win on Windows, Command on Mac)
   *
   * - "CtrlCmd" (Ctrl on Windows, Command on Mac)
   * - "WinCtrl" (Win on Windows, Control on Mac)
   *
   * and where `{other}` can be any other string (typically, a key or mouse button).
   */
  constructor(str: string) {
    this.ctrl = false;
    this.alt = false;
    this.shift = false;
    this.meta = false;
    this.str = "";
    this.prettyStr = "";

    // Remove all whitespace characters
    str = str.replace(/\s/g, "");

    // Extract the modifiers.
    const tokens = str.split("+");
    const mac = isMacPlatform();
    for (const token of tokens) {
      if (token === "Ctrl") {
        this.ctrl = true;
      } else if (token === "Shift") {
        this.shift = true;
      } else if (token === "Alt") {
        this.alt = true;
      } else if (token === "Meta") {
        this.meta = true;
      } else if (token === "CtrlCmd") {
        if (mac) {
          this.meta = true;
        } else {
          this.ctrl = true;
        }
      } else if (token === "WinCtrl") {
        if (mac) {
          this.ctrl = true;
        } else {
          this.meta = true;
        }
      } else {
        break; // reached the "rest"
      }
    }

    // Convert to:
    // - A unique string representation for the modifiers, that can be used for
    //   debugging or comparisons.
    // - A human-readable representation (TODO: make locale-dependent,
    //   e.g., "Maj" instead of "Shift" in French)
    //
    const strings = [];
    const prettyStrings = [];
    if (this.ctrl) {
      strings.push("Ctrl");
      prettyStrings.push(mac ? "^" : "Ctrl");
    }
    if (this.alt) {
      strings.push("Alt");
      prettyStrings.push(mac ? "⌥" : "Alt");
    }
    if (this.shift) {
      strings.push("Shift");
      prettyStrings.push(mac ? "⇧" : "Shift");
    }
    if (this.meta) {
      strings.push("Meta");
      prettyStrings.push(mac ? "⌘" : "Win");
    }
    this.str = strings.join("+");
    this.prettyStr += prettyStrings.join(" ");
  }

  /**
   * Returns whether this set of modifiers matches the given event.
   *
   * Note that this means an exact match, for example if the user presses
   * Ctrl+Shift, then `new KeyboardModifiers("Ctrl+Z").matches(event)` is
   * false.
   *
   */
  matches(event: {
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
  }) {
    return (
      event.ctrlKey === this.ctrl &&
      event.altKey === this.alt &&
      event.shiftKey === this.shift &&
      event.metaKey === this.meta
    );
  }
}
