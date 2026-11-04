import { describe, expect, it } from "vitest";
import { formatIdentifierInput, isValidIdentifier } from "./identifier";

describe("identificador del login", () => {
  it.each(["(626) 346-7630", "6263467630", "+1 626 346 7630", "16263467630", "626.346.7630", "CE1009757", "ce1009757"])(
    "acepta %s",
    (value) => expect(isValidIdentifier(value)).toBe(true),
  );

  it.each(["55512", "26263467630", "hello", "CE", "CE12", "626346763a", ""])("rechaza %s", (value) =>
    expect(isValidIdentifier(value)).toBe(false),
  );

  it.each([
    ["5", "(5"],
    ["512", "(512"],
    ["5127", "(512) 7"],
    ["512787", "(512) 787"],
    ["5127875", "(512) 787-5"],
    ["5127875975", "(512) 787-5975"],
    ["51278759751234", "(512) 787-5975"],
    ["+1 512 787 5975", "(512) 787-5975"],
    ["15127875975", "(512) 787-5975"],
    ["(512) 787-5975", "(512) 787-5975"],
    ["512.787.5975", "(512) 787-5975"],
    ["(512", "(512"],
    ["(", ""],
    ["", ""],
  ])("formatea el celular %s como %s", (input, expected) => expect(formatIdentifierInput(input)).toBe(expected));

  it.each(["C", "CE", "ce1009757", "CE1009757", " CE 1009757"])("deja la cuenta %s como se escribió", (value) =>
    expect(formatIdentifierInput(value)).toBe(value),
  );
});
