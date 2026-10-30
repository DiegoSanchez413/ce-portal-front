import { describe, expect, it } from "vitest";
import type { Document } from "@/lib/api/types";
import { attentionColor, canUpdate, canView, checkFiles, documentNote, MAX_FILE_BYTES, STATUS_COLORS } from "./documents";

const doc = (over: Partial<Document>): Document => ({
  type: "id",
  status: "approved",
  uploaded_at: "2026-01-10",
  expiration: "2027-01-10",
  expires_in_days: 200,
  reject_reason: null,
  ...over,
});

describe("document rules", () => {
  it("colors each status like the mockup", () => {
    expect(STATUS_COLORS.approved.fg).toBe("#15803D");
    expect(STATUS_COLORS.in_review.bg).toBe("#DBEAFE");
    expect(STATUS_COLORS.rejected).toEqual(STATUS_COLORS.expired);
    expect(STATUS_COLORS.missing.fg).toBe("#4B5563");
  });

  it("warns when an approved document expires in 30 days or less", () => {
    expect(documentNote(doc({ expires_in_days: 21 }))).toEqual({ kind: "warn", days: 21 });
    expect(documentNote(doc({ expires_in_days: 31 }))).toBeNull();
  });

  it("shows the rejection reason in red", () => {
    expect(documentNote(doc({ status: "rejected", reject_reason: "The bill is older than 60 days." }))).toEqual({
      kind: "error",
      reason: "The bill is older than 60 days.",
    });
    expect(documentNote(doc({ status: "rejected", reject_reason: null }))).toBeNull();
  });

  it("never offers View for SSN or a missing document, nor Update while in review", () => {
    expect(canView(doc({ type: "ssn" }))).toBe(false);
    expect(canView(doc({ status: "missing" }))).toBe(false);
    expect(canView(doc({ type: "utility_bill", status: "expired" }))).toBe(true);
    expect(canUpdate(doc({ status: "in_review" }))).toBe(false);
    expect(canUpdate(doc({ status: "missing" }))).toBe(true);
  });

  it("uses amber for expiring, gray for missing and red otherwise on Home", () => {
    expect(attentionColor(doc({ expires_in_days: 10 }))).toBe("#B45309");
    expect(attentionColor(doc({ status: "missing" }))).toBe("#4B5563");
    expect(attentionColor(doc({ status: "expired" }))).toBe("#DC2626");
  });
});

describe("checkFiles", () => {
  const file = (type: string, size = 1000) => ({ type, size });

  it("accepts JPG, PNG and PDF up to 10 MB", () => {
    expect(checkFiles([file("image/jpeg"), file("image/png"), file("application/pdf", MAX_FILE_BYTES)], 3)).toBeNull();
  });

  it("rejects other types, bigger files and too many files", () => {
    expect(checkFiles([file("image/webp")], 3)).toBe("type");
    expect(checkFiles([file("image/png", MAX_FILE_BYTES + 1)], 3)).toBe("size");
    expect(checkFiles([file("image/png"), file("image/png"), file("image/png"), file("image/png")], 3)).toBe("count");
    expect(checkFiles(Array.from({ length: 10 }, () => file("image/png")), 10)).toBeNull();
  });
});
