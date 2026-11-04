import { api } from "@/lib/api/client";
import type { PortalSessionInfo, Reactivation } from "@/lib/api/types";

export type SessionState =
  | { kind: "active"; session: PortalSessionInfo }
  | { kind: "signed_out"; reason?: SignOutReason }
  | { kind: "no_access"; reactivation: Reactivation | undefined };

export type SignOutReason = "session_expired" | "portal_disabled";

export const SESSION_KEY = ["session"] as const;

// Estado de la sesión según GET /session: activa, sin sesión (401, con el motivo si la cerró el back) o sin acceso (403).
export async function fetchSession(): Promise<SessionState> {
  const { data, error, response } = await api.GET("/session");
  if (data) return { kind: "active", session: data };
  if (response.status === 401) {
    const code = error && "code" in error ? error.code : undefined;
    return { kind: "signed_out", reason: code === "session_expired" || code === "portal_disabled" ? code : undefined };
  }
  if (response.status === 403 && error && "reactivation" in error) {
    return { kind: "no_access", reactivation: error.reactivation };
  }
  throw new Error(`Session request failed with ${response.status}`);
}
