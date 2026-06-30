export const defaultFontFamily =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", ui-sans-serif, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';

export const defaultFontSizeInRem = 0.75;

export function defaultScaledFontSize(s: number) {
  return `${defaultFontSizeInRem * s}rem`;
}

export const defaultFontSize = defaultScaledFontSize(1);

export const defaultFontWeight = "400";
