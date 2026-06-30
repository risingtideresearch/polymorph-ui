import { describe, test, expect } from "vitest";

import { stringValidatorFromPattern } from "./Pattern";

describe("stringValidatorFromPattern", () => {
  test("undefined pattern accepts everything", () => {
    const validate = stringValidatorFromPattern(undefined);
    expect(validate("")).toEqual([true]);
    expect(validate("anything")).toEqual([true]);
  });

  test("string pattern is interpreted as a regular expression", () => {
    const validate = stringValidatorFromPattern("^[0-9]+$");
    expect(validate("123")).toEqual([true]);
    expect(validate("12a")).toEqual([false]);
  });

  test("RegExp pattern is used directly", () => {
    const validate = stringValidatorFromPattern(/^[0-9]+$/);
    expect(validate("42")).toEqual([true]);
    expect(validate("")).toEqual([false]);
  });

  test("function pattern is returned as-is, including conversions", () => {
    const validate = stringValidatorFromPattern((s) =>
      s === "" ? [false, "0"] : [true],
    );
    expect(validate("5")).toEqual([true]);
    expect(validate("")).toEqual([false, "0"]);
  });
});
