import { describe, expect, it } from "vitest";
import { lateBreakdown, paymentConcept, planPaymentLine, receiptAvailable, STATUS_STYLES } from "./history";

const line = ({ plan, n, total }: { plan: string; n: number; total: number }) => `${plan} · payment ${n} of ${total}`;

describe("paymentConcept", () => {
  it("traduce pago inicial y mensual sin detalle", () => {
    expect(paymentConcept({ concept: "monthly_payment", label: "Monthly Payment(Recovery)" })).toEqual({ key: "monthly_payment", detail: null });
    expect(paymentConcept({ concept: "initial_payment", label: "Initial payment" })).toEqual({ key: "initial_payment", detail: null });
  });

  it("muestra el detalle original en cargos y otros", () => {
    expect(paymentConcept({ concept: "charge", label: "NCR(NEW CREDIT REPORT)" })).toEqual({ key: "charge", detail: "NCR(NEW CREDIT REPORT)" });
    expect(paymentConcept({ concept: "other", label: "Credit" })).toEqual({ key: null, detail: "Credit" });
  });
});

describe("estados del historial", () => {
  it("solo los pagos aprobados tienen recibo", () => {
    expect(receiptAvailable({ status: "approved" })).toBe(true);
    for (const status of ["declined", "refunded", "voided", "other"] as const) {
      expect(receiptAvailable({ status })).toBe(false);
    }
  });

  it("usa verde para aprobado, rojo para rechazado y gris para reembolsado o anulado", () => {
    expect(STATUS_STYLES.approved.fg).toBe("#15803D");
    expect(STATUS_STYLES.declined.fg).toBe("#B91C1C");
    expect(STATUS_STYLES.refunded.bg).toBe("#EEF0F3");
    expect(STATUS_STYLES.voided.bg).toBe("#EEF0F3");
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
