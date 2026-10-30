"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { HelpLinks } from "./help-links";
import { NAV_ITEMS, isActive } from "./nav-items";

// Menú lateral de escritorio con las secciones y el bloque de ayuda.
export function SideNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("label")}
      className="flex flex-col gap-1 self-start rounded-2xl bg-card px-3 py-4 shadow-[0_4px_20px_rgba(31,42,68,.06)]"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-[15px] font-bold hover:bg-muted",
              active
                ? "bg-brand-soft text-brand hover:bg-brand-soft"
                : label === "letters"
                  ? "text-brand-strong"
                  : "text-ink-muted",
            )}
          >
            <Icon className="size-[22px]" aria-hidden />
            {t(label)}
          </Link>
        );
      })}
      <HelpLinks />
    </nav>
  );
}
