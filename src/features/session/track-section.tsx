"use client";

import { useEffect } from "react";
import { api } from "@/lib/api/client";

export type Section = "home" | "credit" | "payments" | "my_files" | "upload_letters" | "profile" | "my_access";

// Registra la visita a la sección sin esperar respuesta; un error no afecta la navegación.
export function TrackSection({ section }: { section: Section }) {
  useEffect(() => {
    api.POST("/events/section-view", { body: { section } }).catch(() => undefined);
  }, [section]);

  return null;
}
