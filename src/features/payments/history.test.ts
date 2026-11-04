import { describe, expect, it } from "vitest";
import { lateBreakdown, paymentConcept, planPaymentLine, receiptAvailable, STATUS_TONES } from "./history";

const line = ({ plan, n, total }: { plan: string; n: number; total: number }) => `${plan} · payment ${n} of ${total}`;

describe("paymentConcept", () => {
  it("traduce pago inicial y mensual sin detalle", () => {
    expect(paymentConcept({ concept: "monthly_payment", label: "Monthly Payment(Recovery)" })).toEqual({ key: "monthly_payment", detail: null });
    expect(paymentConcept({ concept: "initial_payment", label: "Initial payment" })).toEqual({ key: "initial_payment", detail: null });
  });

  it("muestra el detalle original en cargos y otros", () => {
    expect(paymentConcept({ concept: "charge", label: "NCR(NEW CREDIT REPORT)" })).toEqual({ key: "charge", detail: "NCR(NEW CREDIT REPORT)" });
    expect(paymentConcept({ concept: "other", label: "Credit" })).toEqual({ key: null, detail: "Credit" });
    expect(paymentConcept({ concept: "refund", label: "Refund" })).toEqual({ key: "refund", detail: null });
    expect(paymentConcept({ concept: "yearly_total", label: "2014" })).toEqual({ key: "yearly_total", detail: "2014" });
  });
});

describe("planPaymentLine", () => {
  it("no arma la línea del plan cuando el plan no tiene nombre ni pagos", () => {
    const template = ({ plan, n, total }: { plan: string; n: number; total: number }) => `${plan} · payment ${n} of ${total}`;
    expect(planPaymentLine({ name: "DIRECT 3", total_payments: 3 }, 1, template)).toBe("DIRECT 3 · payment 1 of 3");
    expect(planPaymentLine({ name: "", total_payments: 0 }, 1, template)).toBeNull();
  });
});

describe("estados del historial", () => {
  it("muestra el recibo solo en los pagos que el back marca con receipt_id", () => {
    expect(receiptAvailable({ receipt_id: "120087884679" })).toBe(true);
    expect(receiptAvailable({ receipt_id: "57ffc6f4-156e-11ea-a65a-16ec3745526d" })).toBe(true);
    expect(receiptAvailable({ receipt_id: null })).toBe(false);
  });

  it("usa verde para aprobado, rojo para rechazado y gris para reembolsado o anulado", () => {
    expect(STATUS_TONES.approved).toBe("success");
    expect(STATUS_TONES.declined).toBe("danger");
    expect(STATUS_TONES.refunded).toBe("neutral");
    expect(STATUS_TONES.voided).toBe("neutral");
  });
});

describe("planPaymentLine", () => {
  it("arma la línea del plan cuando el pago cubre una mensualidad", () => {
    expect(planPaymentLine({ name: "LONG 12", total_payments: 12 }, 7, line)).toBe("LONG 12 · payment 7 of 12");
  });

  it("no la muestra en cargos o sin plan", () => {
    expect(planPaymentLine({ name: "LONG 12", total_payments: 12 }, null, line)).toBeNull();
    expect(planPaymentLine(null, 3, line)).toBeNull();
  });
});

describe("lateBreakdown", () => {
  it("multiplica los meses pendientes por la mensualidad", () => {
    expect(lateBreakdown(2, 59)).toBe("2 × $59.00 = $118.00");
    expect(lateBreakdown(1, 99.5)).toBe("1 × $99.50 = $99.50");
  });
});
