"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { useSession } from "@/features/session/session-context";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// Switch EN/ES: cambia el idioma de la ruta actual sin salir de la página.
export function LanguageSwitch({ size = "md" }: { size?: "sm" | "md" }) {
  const t = useTranslations("Header");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const session = useSession();

  const change = (next: Locale) => {
    if (next === locale) return;
    session?.saveLanguage(next);
    startTransition(() => router.replace(pathname, { locale: next }));
  };

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn(
        "flex rounded-full bg-muted",
        size === "md" ? "h-10 p-1" : "h-9 p-[3px]",
      )}
    >
      {routing.locales.map((code) => (
        <button
          key={code}
          type="button"
          disabled={pending}
          aria-pressed={code === locale}
          onClick={() => change(code)}
          className={cn(
            "min-w-11 rounded-full font-extrabold uppercase hover:text-navy",
            size === "md" ? "px-3.5 text-sm" : "px-3 text-[13px]",
            code === locale
              ? "bg-card text-navy shadow-[0_1px_4px_rgba(31,42,68,.15)]"
              : "text-ink-muted",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
