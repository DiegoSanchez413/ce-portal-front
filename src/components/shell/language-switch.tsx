"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Segmented } from "@/components/ui/choice";
import { useSession } from "@/features/session/session-context";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

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
