"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Segmented } from "@/components/ui/choice";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocaleSwitch } from "@/i18n/client-locale";
import { routing, type Locale } from "@/i18n/routing";

// Switch EN/ES del header.
export function LanguageSwitch({ size = "md" }: { size?: "sm" | "md" }) {
  const t = useTranslations("Header");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const localeSwitch = useLocaleSwitch();

  // Cambia solo los textos en la misma pantalla; sin el proveedor de idioma, navega a la ruta del otro idioma.
  const change = (next: Locale) => {
    if (next === locale) return;
    if (localeSwitch) return localeSwitch.setLocale(next);
    startTransition(() => router.replace(pathname, { locale: next }));
  };

  return (
    <Segmented
      label={t("language")}
      size={size}
      disabled={pending}
      value={locale as Locale}
      onChange={change}
      options={routing.locales.map((code) => ({ value: code, label: code }))}
    />
  );
}
