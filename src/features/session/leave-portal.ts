import { getPathname } from "@/i18n/navigation";
import type { SignOutReason } from "./session-query";

// Vuelve al login con recarga completa para no conservar estado del portal ni del login anterior.
export function leavePortal(locale: string, reason?: SignOutReason) {
  const query = reason ? `?reason=${reason}` : "";
  window.location.replace(getPathname({ href: "/login", locale }) + query);
}
