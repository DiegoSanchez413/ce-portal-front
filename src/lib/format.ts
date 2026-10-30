const intlLocale = (locale: string) => (locale === "es" ? "es-US" : "en-US");

// Montos siempre en dólares con dos decimales: $1,234.56.
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

// Fecha "YYYY-MM-DD" del back como fecha local, sin corrimiento por zona horaria.
export function parseDate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

// "Oct 10, 2026" / "10 oct 2026".
export function formatDate(value: string, locale: string): string {
  return parseDate(value).toLocaleDateString(intlLocale(locale), { month: "short", day: "numeric", year: "numeric" });
}

// Instante ISO del back mostrado como fecha local del navegador.
export function formatInstantDate(value: string, locale: string): string {
  return new Date(value).toLocaleDateString(intlLocale(locale), { month: "short", day: "numeric", year: "numeric" });
}

// "Oct 5" / "5 oct".
export function formatShortDate(value: string, locale: string): string {
  return parseDate(value).toLocaleDateString(intlLocale(locale), { month: "short", day: "numeric" });
}

// "Thu, Oct 29" / "jue, 29 oct".
export function formatWeekdayDate(value: string, locale: string): string {
  return parseDate(value).toLocaleDateString(intlLocale(locale), { weekday: "short", month: "short", day: "numeric" });
}

// "16:00" → "4:00 PM".
export function formatClock(time: string, locale: string): string {
  const [h, m] = time.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(intlLocale(locale), { hour: "numeric", minute: "2-digit" });
}

export function formatDateTime(value: Date, locale: string, withYear: boolean): string {
  return value.toLocaleString(intlLocale(locale), {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTimeOfDay(value: Date, locale: string): string {
  return value.toLocaleTimeString(intlLocale(locale), { hour: "numeric", minute: "2-digit" });
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
