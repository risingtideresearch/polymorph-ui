import { useInputIdBase } from "../../hooks";
import { InputLabel, InputContainer } from "../InputBase/InputBase";
import { Select, SelectOption } from "../Select/Select";

export function EnumInput<T extends string>({
  value,
  label,
  setValue,
  options,
  idBase,
}: {
  label?: string;
  value: T;
  setValue: (v: T) => void;
  options: { [key in T]: string };
  idBase?: string;
}) {
  const _idBase = useInputIdBase(idBase);

  return (
    <InputContainer id={_idBase}>
      <InputLabel idBase={_idBase}>{label}</InputLabel>
      <Select
        id={`${_idBase}::input`}
        value={value}
        onChange={(e) => {
          setValue(e as T);
        }}
      >
        {Object.entries(options).map(([option, desc]) => (
          <SelectOption key={option} value={option}>
            {desc as string}
          </SelectOption>
        ))}
      </Select>
    </InputContainer>
  );
}
