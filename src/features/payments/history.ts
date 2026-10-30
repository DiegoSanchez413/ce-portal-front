import { formatMoney } from "@/lib/format";
import type { PaymentItem } from "@/lib/api/types";

export type PaymentStatus = PaymentItem["status"];

export const STATUS_STYLES: Record<PaymentStatus, { fg: string; bg: string }> = {
  approved: { fg: "#15803D", bg: "#DCFCE7" },
  declined: { fg: "#B91C1C", bg: "#FEE2E2" },
  refunded: { fg: "#4B5563", bg: "#EEF0F3" },
  voided: { fg: "#4B5563", bg: "#EEF0F3" },
  other: { fg: "#4B5563", bg: "#EEF0F3" },
};

// Concepto visible: los tipos conocidos se traducen; cargos y otros muestran el detalle original.
export function paymentConcept(item: Pick<PaymentItem, "concept" | "label">): { key: "initial_payment" | "monthly_payment" | "charge" | null; detail: string | null } {
  if (item.concept === "initial_payment" || item.concept === "monthly_payment") return { key: item.concept, detail: null };
  if (item.concept === "charge") return { key: "charge", detail: item.label || null };
  return { key: null, detail: item.label || null };
}

// "LONG 12 · payment 7 of 12" solo cuando el pago cubre una mensualidad del plan.
export function planPaymentLine(
  plan: { name: string; total_payments: number } | null | undefined,
  planPayment: number | null,
  template: (values: { plan: string; n: number; total: number }) => string,
): string | null {
  if (!plan || planPayment === null) return null;
  return template({ plan: plan.name, n: planPayment, total: plan.total_payments });
}

// Desglose de pagos atrasados: "2 × $59.00 = $118.00".
export function lateBreakdown(count: number, monthly: number): string {
  return `${count} × ${formatMoney(monthly)} = ${formatMoney(Math.round(count * monthly * 100) / 100)}`;
}

export function receiptAvailable(item: Pick<PaymentItem, "status">): boolean {
  return item.status === "approved";
}
