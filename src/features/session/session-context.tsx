"use client";

import { createContext, useContext } from "react";
import type { PortalSessionInfo } from "@/lib/api/types";

export type SessionActions = {
  session: PortalSessionInfo;
  signOut: () => void;
  switchClient: () => void;
  switchAccount: (accountId: string) => void;
  saveLanguage: (language: "en" | "es") => void;
};

export const SessionContext = createContext<SessionActions | null>(null);

// Sesión del cliente y sus acciones; null en las pantallas sin sesión.
export function useSession(): SessionActions | null {
  return useContext(SessionContext);
}
