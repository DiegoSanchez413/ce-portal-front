import { getPathname } from "@/i18n/navigation";

// Vuelve al login con recarga completa para no conservar estado del portal ni del login anterior.
export function leavePortal(locale: string) {
  window.location.replace(getPathname({ href: "/login", locale }));
}
