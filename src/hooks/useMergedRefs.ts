import { Ref, useCallback } from "react";

/**
 * Merges multiple refs into a single callback ref.
 *
 * Useful when a component needs its own ref internally while also forwarding it
 * to a parent. Supports RefObject and callback refs.
 *
 * Example:
 *
 * ```
 * import { useRef, useEffect } from "react";
 * import { useMergedRef } from "polymorph-ui";
 *
 * function MyInput({ ref, ...props }: React.ComponentProps<"input">) {
 *   const innerRef = useRef<HTMLInputElement>(null);
 *   const mergedRef = useMergedRef(innerRef, ref);
 *
 *   useEffect(() => {
 *     innerRef.current?.focus();
 *   }, []);
 *
 *   return <input ref={mergedRef} {...props} />;
 * }
 * ```
 */
export function useMergedRef<T>(...refs: (Ref<T> | undefined)[]) {
  return useCallback((node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }
  }, refs); // eslint-disable-line react-hooks/exhaustive-deps
}
