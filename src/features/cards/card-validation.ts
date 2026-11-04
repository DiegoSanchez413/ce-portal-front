import type { NewCard } from "@/lib/api/types";

export type CardBrand = "VISA" | "MC" | "AMEX" | "DISCOVER";

export type CardDraft = {
  cardholdername: string;
  cardnumber: string;
  expiry: string;
  cvc: string;
  zipcode: string;
  set_default: boolean;
};

export type CardField = "cardholdername" | "cardnumber" | "expiry" | "cvc" | "zipcode";

export const emptyDraft = (setDefault: boolean): CardDraft => ({
  cardholdername: "",
  cardnumber: "",
  expiry: "",
  cvc: "",
  zipcode: "",
  set_default: setDefault,
});

export const digits = (value: string) => value.replace(/\D/g, "");

// Marca por prefijo del número, para el ícono mientras se escribe.
export function detectBrand(number: string): CardBrand | null {
  const n = digits(number);
  if (/^4/.test(n)) return "VISA";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return "MC";
  if (/^3[47]/.test(n)) return "AMEX";
  if (/^(6011|65|64[4-9]|622)/.test(n)) return "DISCOVER";
  return null;
}

export function luhn(number: string): boolean {
  const n = digits(number);
  if (n.length < 13 || n.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

// "1234567812345678" → "1234 5678 1234 5678" (Amex 4-6-5).
export function formatCardNumber(value: string): string {
  const n = digits(value).slice(0, 19);
  const groups = detectBrand(n) === "AMEX" ? [4, 6, 5] : [4, 4, 4, 4, 3];
  const parts: string[] = [];
  let i = 0;
  for (const size of groups) {
    if (i >= n.length) break;
    parts.push(n.slice(i, i + size));
    i += size;
  }
  return parts.join(" ");
}

// Escritura del vencimiento como MM/YY.
export function formatExpiry(value: string): string {
  const n = digits(value).slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
}

export function parseExpiry(value: string): { month: number; year: number } | null {
  const match = /^(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const month = Number(match[1]);
  if (month < 1 || month > 12) return null;
  return { month, year: Number(match[2]) };
}

// Vigente hasta el último día del mes indicado.
export function expiryInFuture(value: string, today = new Date()): boolean {
  const parsed = parseExpiry(value);
  if (!parsed) return false;
  const lastDay = new Date(2000 + parsed.year, parsed.month, 0, 23, 59, 59);
  return lastDay >= today;
}

export function validateDraft(draft: CardDraft, today = new Date()): Partial<Record<CardField, true>> {
  const errors: Partial<Record<CardField, true>> = {};
  if (draft.cardholdername.trim().length < 2) errors.cardholdername = true;
  if (!luhn(draft.cardnumber)) errors.cardnumber = true;
  if (!expiryInFuture(draft.expiry, today)) errors.expiry = true;
  if (!/^\d{3,4}$/.test(draft.cvc)) errors.cvc = true;
  if (!/^\d{5}$/.test(draft.zipcode)) errors.zipcode = true;
  return errors;
}

export function toNewCard(draft: CardDraft): NewCard {
  const expiry = parseExpiry(draft.expiry) ?? { month: 0, year: 0 };
  return {
    cardholdername: draft.cardholdername.trim(),
    cardnumber: digits(draft.cardnumber),
    cvc: draft.cvc,
    exp_month: expiry.month,
    exp_year: expiry.year,
    zipcode: draft.zipcode,
    set_default: draft.set_default,
  };
}

export const BRAND_LABEL: Record<CardBrand, string> = { VISA: "Visa", MC: "Mastercard", AMEX: "Amex", DISCOVER: "Discover" };

// "Visa •••• 2787"; sin marca, "Card •••• 2787".
export function cardLabel(card: { brand?: string | null; last4: string }, fallback = "Card"): string {
  const brand = card.brand && card.brand in BRAND_LABEL ? BRAND_LABEL[card.brand as CardBrand] : fallback;
  return `${brand} •••• ${card.last4}`;
}
