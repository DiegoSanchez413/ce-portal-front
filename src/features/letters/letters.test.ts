import { describe, expect, it } from "vitest";
import { canSendLetter, MAX_NOTE } from "./letters";

describe("canSendLetter", () => {
  it("needs a type and at least one file", () => {
    expect(canSendLetter(null, null, 1, "")).toBe(false);
    expect(canSendLetter("court_document", null, 0, "")).toBe(false);
    expect(canSendLetter("court_document", null, 2, "")).toBe(true);
  });

  it("asks for the bureau only on a bureau response", () => {
    expect(canSendLetter("bureau_response", null, 1, "")).toBe(false);
    expect(canSendLetter("bureau_response", "experian", 1, "")).toBe(true);
    expect(canSendLetter("other", null, 1, "")).toBe(true);
  });

  it("limits the note to 500 characters", () => {
    expect(canSendLetter("other", null, 1, "x".repeat(MAX_NOTE))).toBe(true);
    expect(canSendLetter("other", null, 1, "x".repeat(MAX_NOTE + 1))).toBe(false);
  });
});
