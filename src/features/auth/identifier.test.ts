import { describe, expect, it } from "vitest";
import { isValidIdentifier } from "./identifier";

describe("identificador del login", () => {
  it.each(["(626) 346-7630", "6263467630", "+1 626 346 7630", "16263467630", "626.346.7630", "CE1009757", "ce1009757"])(
    "acepta %s",
    (value) => expect(isValidIdentifier(value)).toBe(true),
  );

  it.each(["55512", "26263467630", "hello", "CE", "CE12", "626346763a", ""])("rechaza %s", (value) =>
    expect(isValidIdentifier(value)).toBe(false),
  );
});
