/**
 * A StringValidator is a function that takes as input a string, and returns:
 *
 * 1. A boolean indicating whether the string is to be considered "valid"
 * 2. Optionally, a valid string that the invalid string should be converted to
 *
 * For example, a number input may consider "" to be an invalid number string,
 * but can reasonably automatically converts this to "0", since the absence
 * of number can often be interpreted as the number being zero.
 */
export type StringValidator = (s: string) => [boolean, string?];

/**
 * A Pattern is a more convenient way to specify a StringValidator.
 *
 * It is either an explicit StringValidator, or a regular expression
 * (specified as a string or as a RegExp object) which can implicitly be
 * converted into a string validator.
 */
export type Pattern = string | RegExp | StringValidator;

/**
 * Converts the given Pattern into a StringValidator.
 */
export function stringValidatorFromPattern(
  pattern: Pattern | undefined,
): StringValidator {
  if (pattern === undefined) {
    return () => [true];
  }
  if (typeof pattern === "function") {
    return pattern;
  }
  const re = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  return (s) => [re.test(s)];
}
