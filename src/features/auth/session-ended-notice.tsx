"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/alert";

// Aviso del login cuando el portal cerró la sesión: lee el motivo de ?reason= que deja leavePortal.
export function SessionEndedNotice() {
  const t = useTranslations("Login");
  const reason = useSearchParams().get("reason");
  if (reason !== "session_expired" && reason !== "portal_disabled") return null;

  return (
    <Alert tone={reason === "portal_disabled" ? "danger" : "info"} icon={<Info className="mt-px size-[18px] shrink-0" strokeWidth={2.25} aria-hidden />}>
      {t(reason === "portal_disabled" ? "portalDisabled" : "sessionExpired")}
    </Alert>
  );
}
