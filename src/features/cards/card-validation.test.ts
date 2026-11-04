import { describe, expect, it } from "vitest";
import { detectBrand, emptyDraft, expiryInFuture, formatCardNumber, formatExpiry, luhn, toNewCard, validateDraft } from "./card-validation";

describe("card validation", () => {
  it("valida el dígito de control (Luhn)", () => {
    expect(luhn("4111 1111 1111 1111")).toBe(true);
    expect(luhn("4111 1111 1111 1112")).toBe(false);
    expect(luhn("4111")).toBe(false);
  });

  it("detecta la marca por prefijo", () => {
    expect(detectBrand("4111")).toBe("VISA");
    expect(detectBrand("5521 0000")).toBe("MC");
    expect(detectBrand("2221")).toBe("MC");
    expect(detectBrand("3782")).toBe("AMEX");
    expect(detectBrand("6011")).toBe("DISCOVER");
    expect(detectBrand("9")).toBeNull();
  });

  it("formatea número y vencimiento mientras se escribe", () => {
    expect(formatCardNumber("4111111111111111")).toBe("4111 1111 1111 1111");
    expect(formatCardNumber("378282246310005")).toBe("3782 822463 10005");
    expect(formatExpiry("1128")).toBe("11/28");
    expect(formatExpiry("1")).toBe("1");
  });

  it("acepta solo vencimientos del mes actual en adelante", () => {
    const today = new Date(2026, 9, 20);
    expect(expiryInFuture("10/26", today)).toBe(true);
    expect(expiryInFuture("09/26", today)).toBe(false);
    expect(expiryInFuture("13/27", today)).toBe(false);
  });

  it("acepta un CVC de 3 o 4 dígitos sin importar la marca, como el Soft y la mini-app", () => {
    const today = new Date(2026, 9, 20);
    const base = { cardholdername: "Luis A", expiry: "04/30", zipcode: "90001", set_default: false };
    for (const cardnumber of ["4111 1111 1111 1111", "3782 822463 10005"]) {
      expect(validateDraft({ ...base, cardnumber, cvc: "123" }, today).cvc).toBeUndefined();
      expect(validateDraft({ ...base, cardnumber, cvc: "1234" }, today).cvc).toBeUndefined();
      expect(validateDraft({ ...base, cardnumber, cvc: "12" }, today).cvc).toBe(true);
    }
  });

  it("marca los campos inválidos y arma la tarjeta para el back", () => {
    const today = new Date(2026, 9, 20);
    expect(validateDraft({ ...emptyDraft(false), cardnumber: "4111", zipcode: "123" }, today)).toEqual({
      cardholdername: true,
      cardnumber: true,
      expiry: true,
      cvc: true,
      zipcode: true,
    });
    const draft = { cardholdername: " Luis A ", cardnumber: "4111 1111 1111 1111", expiry: "04/30", cvc: "123", zipcode: "90001", set_default: true };
    expect(validateDraft(draft, today)).toEqual({});
    expect(toNewCard(draft)).toEqual({ cardholdername: "Luis A", cardnumber: "4111111111111111", cvc: "123", exp_month: 4, exp_year: 30, zipcode: "90001", set_default: true });
  });
});
