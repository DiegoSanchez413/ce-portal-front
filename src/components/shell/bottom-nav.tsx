"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActive } from "./nav-items";

// Barra inferior fija en celular con las 5 secciones.
export function BottomNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line-soft bg-card px-0.5 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(31,42,68,.06)]"
    >
      {NAV_ITEMS.map(({ href, label, mobileLabel, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-13 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold tracking-tight whitespace-nowrap",
              active
                ? "bg-brand-soft text-brand"
                : label === "letters"
                  ? "text-brand-strong"
                  : "text-ink-muted",
            )}
          >
            <Icon className="size-6" aria-hidden />
            {t(mobileLabel ?? label)}
          </Link>
        );
      })}
    </nav>
  );
}
