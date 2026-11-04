import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PayNow } from "@/lib/api/types";
import en from "@/messages/en.json";
import { PayDialog } from "./pay-view";

const api = vi.hoisted(() => ({ GET: vi.fn(), POST: vi.fn() }));
vi.mock("@/lib/api/client", () => ({ api }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const pay: PayNow = {
  payable: true,
  amount: 118,
  count: 2,
  monthly_amount: 59,
  preselected_card_id: 11,
  default_card_expired: true,
  cards: [
    { id: 10, brand: "VISA", last4: "2787", expiration: "01/26", expired: true, expires_soon: false, is_default: true },
    { id: 11, brand: "MC", last4: "5521", expiration: "11/26", expired: false, expires_soon: true, is_default: false },
  ],
};

function renderPay() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <NextIntlClientProvider locale="en" messages={en} timeZone="America/Los_Angeles">
        <PayDialog open onClose={() => {}} />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

const ok = (data: unknown, status = 200) => ({ data, response: new Response(null, { status }) });

describe("Pay now", () => {
  beforeEach(() => {
    api.GET.mockReset().mockResolvedValue(ok(pay));
    api.POST.mockReset();
  });

  it("muestra el monto con el desglose, el aviso de la tarjeta vencida y la siguiente preseleccionada", async () => {
    renderPay();

    expect(await screen.findByText("$118.00")).toBeInTheDocument();
    expect(screen.getByText("2 × $59.00 = $118.00")).toBeInTheDocument();
    expect(screen.getByText(/Your usual card \(Visa •••• 2787\) has expired/)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Mastercard •••• 5521/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByRole("radio", { name: /Visa •••• 2787/ })).not.toBeInTheDocument();
  });

  it("muestra el pago aprobado con su tarjeta", async () => {
    api.POST.mockResolvedValue(ok({ status: "approved", amount: 118, transaction_id: "TX9", message: "Approved", paid_at: "2026-10-27T21:14:00Z", card: { brand: "MC", last4: "5521" } }));
    renderPay();

    fireEvent.click(await screen.findByRole("button", { name: "Pay $118.00" }));

    expect(await screen.findByText("Payment approved")).toBeInTheDocument();
    expect(screen.getByText("Mastercard •••• 5521")).toBeInTheDocument();
    expect(api.POST).toHaveBeenCalledWith("/pay", { body: { idempotency_key: expect.any(String), card_id: 11 } });
  });

  it("muestra el rechazo y deja probar otra tarjeta con una clave nueva", async () => {
    api.POST.mockResolvedValue(ok({ status: "declined", amount: 118, transaction_id: "TX1", message: "Declined", paid_at: null, card: { brand: "MC", last4: "5521" } }));
    renderPay();

    fireEvent.click(await screen.findByRole("button", { name: "Pay $118.00" }));

    expect(await screen.findByText(/Your payment was declined/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pay $118.00" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Try another card" }));
    expect(screen.getByRole("radio", { name: /Use a new card/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByText(/Your payment was declined/)).not.toBeInTheDocument();
  });
});
