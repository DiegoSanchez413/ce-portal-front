import { describe, expect, it } from "vitest";
import type { Card } from "@/lib/api/types";
import { expiredDefault, initialCardId, payBreakdown, screenFor } from "./pay-logic";

const card = (id: number, overrides: Partial<Card> = {}): Card => ({
  id,
  brand: "VISA",
  last4: String(1000 + id),
  expiration: "04/31",
  expired: false,
  expires_soon: false,
  is_default: false,
  ...overrides,
});

describe("pay now", () => {
  it("muestra el desglose solo con cantidad y mensualidad", () => {
    expect(payBreakdown({ count: 2, monthly_amount: 59 })).toBe("2 × $59.00 = $118.00");
    expect(payBreakdown({ count: 1, monthly_amount: 59 })).toBe("1 × $59.00 = $59.00");
    expect(payBreakdown({ count: null, monthly_amount: null })).toBeNull();
  });

  it("preselecciona la sugerida o la primera activa", () => {
    const cards = [card(1, { is_default: true, expired: true }), card(2), card(3)];
    expect(initialCardId({ cards, preselected_card_id: 3 })).toBe(3);
    expect(initialCardId({ cards, preselected_card_id: 1 })).toBe(2);
    expect(initialCardId({ cards: [card(1, { expired: true })], preselected_card_id: null })).toBeNull();
    expect(expiredDefault(cards)?.id).toBe(1);
  });

  it("elige la pantalla según el resultado del cobro", () => {
    expect(screenFor(null)).toBe("review");
    expect(screenFor({ status: "approved" })).toBe("approved");
    expect(screenFor({ status: "declined" })).toBe("declined");
    expect(screenFor({ status: "error" })).toBe("declined");
  });
});
