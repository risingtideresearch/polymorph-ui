import { RefObject, useEffect, useMemo, useState } from "react";

export type ClientSize = {
  width: number;
  height: number;
};

export function useClientSize(ref: RefObject<HTMLElement | null>) {
  const [clientSize, setClientSize] = useState<ClientSize | null>(null);

  const elementObserver = useMemo(() => {
    return new ResizeObserver(() => {
      const element = ref.current;
      if (!element) {
        return;
      }
      setClientSize({
        height: element.clientHeight,
        width: element.clientWidth,
      });
    });
  }, [ref]);

  useEffect(() => {
    const element = ref.current;
    if (!element || !elementObserver) {
      return () => {};
    }
    elementObserver.observe(element);
    return () => {
      elementObserver.unobserve(element);
    };
  }, [elementObserver, ref]);

  return clientSize;
}
