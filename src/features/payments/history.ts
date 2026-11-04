import type { BadgeTone } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import type { PaymentItem } from "@/lib/api/types";

export type PaymentStatus = PaymentItem["status"];

export const STATUS_TONES: Record<PaymentStatus, BadgeTone> = {
  approved: "success",
  declined: "danger",
  refunded: "neutral",
  voided: "neutral",
  other: "neutral",
};

// Concepto visible: los tipos conocidos se traducen; cargos y otros muestran el detalle original.
export function paymentConcept(item: Pick<PaymentItem, "concept" | "label">): { key: "initial_payment" | "monthly_payment" | "charge" | "void" | "refund" | "yearly_total" | null; detail: string | null } {
  if (item.concept === "initial_payment" || item.concept === "monthly_payment" || item.concept === "void" || item.concept === "refund") return { key: item.concept, detail: null };
  if (item.concept === "yearly_total") return { key: "yearly_total", detail: item.label || null };
  if (item.concept === "charge") return { key: "charge", detail: item.label || null };
  return { key: null, detail: item.label || null };
}

// "LONG 12 · payment 7 of 12" solo cuando el pago cubre una mensualidad del plan.
export function planPaymentLine(
  plan: { name: string; total_payments: number } | null | undefined,
  planPayment: number | null,
  template: (values: { plan: string; n: number; total: number }) => string,
): string | null {
  if (!plan || !plan.name || plan.total_payments <= 0 || planPayment === null) return null;
  return template({ plan: plan.name, n: planPayment, total: plan.total_payments });
}

// Desglose de pagos atrasados: "2 × $59.00 = $118.00".
export function lateBreakdown(count: number, monthly: number): string {
  return `${count} × ${formatMoney(monthly)} = ${formatMoney(Math.round(count * monthly * 100) / 100)}`;
}

// El back marca con receipt_id los pagos aprobados que tienen recibo (no el resumen de un año).
export function receiptAvailable(item: Pick<PaymentItem, "receipt_id">): boolean {
  return item.receipt_id !== null;
}
