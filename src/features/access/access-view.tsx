"use client";

import { Monitor, Smartphone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { useCallback, useState } from "react";
import { Card, ErrorNote, ghostButton, outlineButton, PageHeader, primaryButton, QueryState, Sheet, Toast } from "@/features/portal/ui";
import { usePortalQuery } from "@/features/portal/use-portal-query";
import { api } from "@/lib/api/client";
import type { AccessSession } from "@/lib/api/types";
import { formatDateTime, formatTimeOfDay, isSameDay } from "@/lib/format";

// My access: últimas sesiones con este dispositivo marcado y cierre de los demás.
export function AccessView() {
  const t = useTranslations("Access");
  const query = usePortalQuery("access-sessions", () => api.GET("/access/sessions"));
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <QueryState loading={query.isPending} error={query.isError} onRetry={() => void query.refetch()} />
      {query.data && (
        <div className="lg:max-w-[620px]">
          <Card className="gap-4 p-[18px] lg:p-7">
            <ul className="flex flex-col">
              {query.data.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </ul>
            <button type="button" onClick={() => setConfirming(true)} className={outlineButton}>
              {t("signOutOthers")}
            </button>
          </Card>
        </div>
      )}
      {confirming && (
        <ConfirmSheet
          onClose={() => setConfirming(false)}
          onDone={() => {
            setConfirming(false);
            setToast(t("signedOut"));
            void query.refetch();
          }}
        />
      )}
      <Toast message={toast} onDone={clearToast} />
    </div>
  );
}

function SessionRow({ session }: { session: AccessSession }) {
  const t = useTranslations("Access");
  const locale = useLocale();
  const started = new Date(session.started_at);
  const now = new Date();
  const when = isSameDay(started, now)
    ? t("today", { time: formatTimeOfDay(started, locale) })
    : formatDateTime(started, locale, started.getFullYear() !== now.getFullYear());
  const place = [session.city, session.region].filter(Boolean).join(", ");
  const Icon = session.is_phone ? Smartphone : Monitor;

  return (
    <li className="flex items-center gap-3 border-b border-line-soft py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-alt text-navy">
        <Icon className="size-5" strokeWidth={2.25} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-extrabold">
          {session.device} · {session.browser}
        </span>
        <span className="text-[13px] font-semibold text-ink-muted">{place ? `${place} · ${when}` : when}</span>
      </span>
      {session.current && (
        <span className="rounded-full bg-range-good-bg px-2 py-[3px] text-[11px] font-extrabold whitespace-nowrap text-range-good">
          {t("thisDevice")}
        </span>
      )}
    </li>
  );
}

function ConfirmSheet({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const t = useTranslations("Access");
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");

  const confirm = async () => {
    setState("busy");
    try {
      const { response } = await api.POST("/access/sign-out-others");
      if (response.ok) onDone();
      else setState("error");
    } catch {
      setState("error");
    }
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={t("confirmTitle")} description={t("confirmSub")}>
      {state === "error" && <ErrorNote>{t("error")}</ErrorNote>}
      <div className="flex flex-col gap-1">
        <button type="button" onClick={() => void confirm()} disabled={state === "busy"} className={primaryButton}>
          {t("signOutOthers")}
        </button>
        <Dialog.Close className={ghostButton}>{t("cancel")}</Dialog.Close>
      </div>
    </Sheet>
  );
}
