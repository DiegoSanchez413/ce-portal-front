import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import es from "@/messages/es.json";
import en from "@/messages/en.json";
import { BottomNav } from "./bottom-nav";
import { SideNav } from "./side-nav";

const pathname = vi.hoisted(() => ({ current: "/" }));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => pathname.current,
  Link: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function renderWith(ui: ReactNode, locale: "en" | "es" = "en") {
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : es}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("navegación del portal", () => {
  it("el menú lateral lista las 5 secciones, marca la activa y trae la ayuda", () => {
    pathname.current = "/payments";
    renderWith(<SideNav />);

    const nav = screen.getByRole("navigation", { name: "Main" });
    const links = within(nav).getAllByRole("link");
    expect(links.slice(0, 5).map((l) => l.textContent)).toEqual([
      "Home",
      "Credit",
      "Payments",
      "My Files",
      "Upload Letters",
    ]);
    expect(within(nav).getByRole("link", { name: "Payments" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(nav).getByText("Need help?")).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Call" })).toHaveAttribute(
      "href",
      "tel:+18555170390",
    );
  });

  it("la barra inferior usa las etiquetas cortas en español", () => {
    pathname.current = "/";
    renderWith(<BottomNav />, "es");

    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual([
      "Inicio",
      "Crédito",
      "Pagos",
      "Mis archivos",
      "Cartas",
    ]);
    expect(links[0]).toHaveAttribute("aria-current", "page");
  });
});
