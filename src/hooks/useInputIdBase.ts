import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

export function useInputIdBase(providedIdBase?: string) {
  const idBase = useMemo<string>(
    () => providedIdBase ?? uuidv4(),
    [providedIdBase],
  );
  return idBase;
}
