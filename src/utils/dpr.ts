/**
 * Returns the device pixel ratio (DPR) of the current device. If the `window`
 * object is not available (e.g., in a server-side environment), it defaults to
 * 1.
 */
export function dpr(): number {
  return typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
}
