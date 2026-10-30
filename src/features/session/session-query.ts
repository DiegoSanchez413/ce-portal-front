import { api } from "@/lib/api/client";
import type { PortalSessionInfo, Reactivation } from "@/lib/api/types";

export type SessionState =
  | { kind: "active"; session: PortalSessionInfo }
  | { kind: "signed_out" }
  | { kind: "no_access"; reactivation: Reactivation | undefined };

export const SESSION_KEY = ["session"] as const;

// Estado de la sesión según GET /session: activa, sin sesión (401) o sin acceso (403).
export async function fetchSession(): Promise<SessionState> {
  const { data, error, response } = await api.GET("/session");
  if (data) return { kind: "active", session: data };
  if (response.status === 401) return { kind: "signed_out" };
  if (response.status === 403 && error && "reactivation" in error) {
    return { kind: "no_access", reactivation: error.reactivation };
  }
  throw new Error(`Session request failed with ${response.status}`);
}
