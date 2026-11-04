"use client";

import { NextIntlClientProvider, useTimeZone } from "next-intl";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import { routing, type Locale } from "./routing";

const MESSAGES = { en, es } as const;
const ONE_YEAR = 60 * 60 * 24 * 365;

type LocaleSwitch = { locale: Locale; setLocale: (next: Locale) => void };

const LocaleSwitchContext = createContext<LocaleSwitch | null>(null);

// Cambia el idioma en la misma pantalla: solo cambian los textos y el estado (pasos, formularios, datos) se conserva.
// La URL (/login ↔ /es/login) y la cookie NEXT_LOCALE se actualizan sin navegar, para que una recarga coincida.
export function ClientLocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const timeZone = useTimeZone();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    if (!routing.locales.includes(next)) return;
    setLocaleState(next);
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    document.documentElement.lang = next;
    window.history.replaceState(window.history.state, "", localizedUrl(window.location, next));
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <LocaleSwitchContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone={timeZone}>
        {children}
      </NextIntlClientProvider>
    </LocaleSwitchContext.Provider>
  );
}

export function useLocaleSwitch(): LocaleSwitch | null {
  return useContext(LocaleSwitchContext);
}

// La misma dirección con el prefijo del idioma: inglés sin prefijo y español bajo /es.
function localizedUrl({ pathname, search, hash }: Location, next: Locale): string {
  const bare = pathname.replace(/^\/es(?=\/|$)/, "") || "/";
  const path = next === routing.defaultLocale ? bare : `/${next}${bare === "/" ? "" : bare}`;
  return `${path}${search}${hash}`;
}
