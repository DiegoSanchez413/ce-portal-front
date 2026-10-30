import { defineRouting } from "next-intl/routing";

// Idiomas del portal: inglés sin prefijo en la URL, español bajo /es.
export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
