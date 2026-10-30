"use client";

import { CircleCheck, Phone, UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { api } from "@/lib/api/client";
import type { Reactivation } from "@/lib/api/types";
import { AuthCard, AuthTitle, Banner, outlineButton, primaryButton } from "./ui";

// Pantalla sin acceso: llamada a Customer Care y solicitud de reactivación (una cada 24 h).
export function NoAccess({ reactivation }: { reactivation: Reactivation | undefined }) {
  const t = useTranslations("NoAccess");
  const [sent, setSent] = useState(false);
  const [blocked, setBlocked] = useState(() =>
    Boolean(reactivation?.available_at && Date.parse(reactivation.available_at) > Date.now()),
  );
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const request = async () => {
    if (!reactivation?.token) return;
    setBusy(true);
    setFailed(false);
    try {
      const { data } = await api.POST("/auth/reactivation", { body: { token: reactivation.token } });
      if (!data) return setFailed(true);
      setSent(data.sent);
      setBlocked(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard>
      <div className="flex flex-col items-center gap-3.5 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-line-soft text-ink-muted">
          <UserX className="size-[30px]" strokeWidth={2.25} aria-hidden />
        </span>
        <AuthTitle title={t("title")}>{t("subtitle")}</AuthTitle>
      </div>
      {sent && (
        <Banner tone="success" icon={<CircleCheck className="mt-px size-[18px] shrink-0 text-whatsapp" strokeWidth={2.5} aria-hidden />}>
          {t("sent")}
        </Banner>
      )}
      {failed && <p className="text-center text-[13px] font-semibold text-danger">{t("error")}</p>}
      <div className="flex flex-col gap-3">
        <a href="tel:+18555170390" className={primaryButton}>
          <Phone className="size-[18px]" strokeWidth={2.25} aria-hidden />
          {t("call")}
        </a>
        <button
          type="button"
          onClick={() => void request()}
          disabled={blocked || busy || !reactivation?.token}
          className={outlineButton}
        >
          {t("reactivate")}
        </button>
      </div>
    </AuthCard>
  );
}
