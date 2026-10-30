import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import type { CodeChallenge } from "@/lib/api/types";
import { CodeStep } from "./code-step";

const post = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/client", () => ({ api: { POST: post } }));

const challenge: CodeChallenge = {
  challenge_id: "6b1f3c1e-0000-4000-8000-000000000000",
  channel: "sms",
  destination: "***-***-7392",
  mobile: "***-***-7392",
  email: "l*****@gmail.com",
  resend_available_at: new Date(Date.now() + 59_000).toISOString(),
  expires_in: 300,
};

function renderStep(locale: "en" | "es" = "en", overrides: Partial<CodeChallenge> = {}) {
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : es} timeZone="America/Los_Angeles">
      <CodeStep challenge={{ ...challenge, ...overrides }} onChallenge={vi.fn()} onResult={vi.fn()} onRestart={vi.fn()} />
    </NextIntlClientProvider>,
  );
}

function typeCode(code: string) {
  fireEvent.change(screen.getByLabelText("Digit 1"), { target: { value: code } });
}

describe("pantalla del código", () => {
  beforeEach(() => post.mockReset());

  it("muestra el destino, Keep me signed in marcada y el contador de reenvío", () => {
    renderStep();

    expect(screen.getByText("***-***-7392")).toBeInTheDocument();
    expect(screen.getByLabelText("Keep me signed in on this device")).toBeChecked();
    expect(screen.getByText(/^Resend code in 0:5\d$/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send code to my email" })).toBeInTheDocument();
  });

  it("no ofrece el correo cuando el cliente no tiene uno", () => {
    renderStep("en", { email: null });
    expect(screen.queryByRole("button", { name: "Send code to my email" })).not.toBeInTheDocument();
  });

  it("muestra los intentos restantes cuando el código es incorrecto", async () => {
    post.mockResolvedValue({
      data: undefined,
      error: { code: "incorrect_code", message: "Incorrect code. 3 attempts left.", attempts_left: 3 },
      response: { status: 422 },
    });
    renderStep();

    typeCode("482913");

    expect(await screen.findByText("Incorrect code. 3 attempts left.")).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith("/auth/verify", {
      body: { challenge_id: challenge.challenge_id, code: "482913", keep_signed_in: true },
    });
  });

  it("bloquea casillas y botones y dice a qué hora reintentar", async () => {
    const until = new Date(Date.now() + 15 * 60_000);
    post.mockResolvedValue({
      data: undefined,
      error: { code: "locked", message: "Too many attempts.", until: until.toISOString() },
      response: { status: 423 },
    });
    renderStep();

    typeCode("000000");

    expect(await screen.findByText("Too many attempts. Please try again in 15 minutes.")).toBeInTheDocument();
    const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(until);
    expect(screen.getByText(`You can try again at ${time}`)).toBeInTheDocument();
    expect(screen.getByLabelText("Digit 1")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Verify" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send code to my email" })).toBeDisabled();
  });

  it("traduce el error de intentos en español", async () => {
    post.mockResolvedValue({
      data: undefined,
      error: { code: "incorrect_code", message: "", attempts_left: 1 },
      response: { status: 422 },
    });
    renderStep("es");

    fireEvent.change(screen.getByLabelText("Dígito 1"), { target: { value: "111111" } });

    expect(await screen.findByText("Código incorrecto. Le queda 1 intento.")).toBeInTheDocument();
  });
});
