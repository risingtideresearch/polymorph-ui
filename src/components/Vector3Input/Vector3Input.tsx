import { Vector3 } from "three";
import { useCallback } from "react";
import { NumberInput } from "../NumberInput/NumberInput";

// Note: using a getter function for position (instead of a value)
// makes it possible to memoize the onXChange/onYChange/onZChange functions.
// Otherwise, they would have to capture the other coordinates, meaning they
// would have to change each time any coordinate changes.
//
interface Vector3InputProps {
  getValue: () => Vector3;
  setValue: (v: Vector3) => void;
}

export function Vector3Input({ getValue, setValue }: Vector3InputProps) {
  const position = getValue();

  const onXChange = useCallback(
    (value: number) => {
      setValue(getValue().clone().setX(value));
    },
    [getValue, setValue],
  );

  const onYChange = useCallback(
    (value: number) => {
      setValue(getValue().clone().setY(value));
    },
    [getValue, setValue],
  );

  const onZChange = useCallback(
    (value: number) => {
      setValue(getValue().clone().setZ(value));
    },
    [getValue, setValue],
  );

  return (
    <>
      <NumberInput label="x" value={position.x} onChange={onXChange} />
      <NumberInput label="y" value={position.y} onChange={onYChange} />
      <NumberInput label="z" value={position.z} onChange={onZChange} />
    </>
  );
}
