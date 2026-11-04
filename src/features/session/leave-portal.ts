import { getPathname } from "@/i18n/navigation";
import type { SignOutReason } from "./session-query";

// Marca de la pestaña: cuenta cuyo idioma (leads.language) ya se aplicó en esta visita.
export const LANGUAGE_SYNCED = "cp_language_synced";

// Vuelve al login con recarga completa para no conservar estado del portal ni del login anterior.
export function leavePortal(locale: string, reason?: SignOutReason) {
  sessionStorage.removeItem(LANGUAGE_SYNCED);
  const query = reason ? `?reason=${reason}` : "";
  window.location.replace(getPathname({ href: "/login", locale }) + query);
}
