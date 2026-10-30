import { lateBreakdown } from "@/features/payments/history";
import type { Card, PayNow } from "@/lib/api/types";

// Desglose "2 × $59.00 = $118.00" solo cuando el back informa cantidad y mensualidad.
export function payBreakdown(pay: Pick<PayNow, "count" | "monthly_amount">): string | null {
  if (!pay.count || !pay.monthly_amount) return null;
  return lateBreakdown(pay.count, pay.monthly_amount);
}

export const usableCards = (cards: Card[]) => cards.filter((card) => !card.expired);

// Tarjeta marcada al abrir: la que sugiere el back si sigue activa, si no la primera activa.
export function initialCardId(pay: Pick<PayNow, "cards" | "preselected_card_id">): number | null {
  const usable = usableCards(pay.cards);
  return usable.find((card) => card.id === pay.preselected_card_id)?.id ?? usable[0]?.id ?? null;
}

export const expiredDefault = (cards: Card[]) => cards.find((card) => card.is_default && card.expired) ?? null;

export type PayScreen = "review" | "approved" | "declined";

// Pantalla que corresponde al resultado del cobro; un error se trata como declinado.
export function screenFor(result: { status: string } | null): PayScreen {
  if (!result) return "review";
  return result.status === "approved" ? "approved" : "declined";
}
